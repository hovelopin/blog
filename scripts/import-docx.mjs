#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function which(bin) {
  try {
    execFileSync("which", [bin], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const args = { input: null, slug: null, force: false };
  for (const a of argv) {
    if (a.startsWith("--slug=")) args.slug = a.slice(7);
    else if (a === "--force") args.force = true;
    else if (a === "-h" || a === "--help") args.help = true;
    else if (!args.input) args.input = a;
    else fail(`Unexpected argument: ${a}`);
  }
  return args;
}

function printHelp() {
  console.log(`Usage: pnpm import:docx <file.doc|.docx> [--slug=my-slug] [--force]

Converts a Word/Confluence-export document to a Markdown post.
- MHTML (.doc from Confluence "Export to Word"): parsed inline
- .doc (real Word): textutil → HTML → pandoc
- .docx: pandoc directly
- Images go to public/imports/<slug>/, paths rewritten in the markdown.`);
}

function slugify(name) {
  const decoded = decodeURIComponent(name).replace(/\+/g, "-");
  return decoded
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function escapeYaml(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildFrontmatter({ title, description, date }) {
  return `---
title: "${escapeYaml(title)}"
description: "${escapeYaml(description)}"
date: "${date}"
tags: []
author: "hovelopin"
---

`;
}

function extractFirstH1(md) {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/);
    if (m) {
      lines.splice(i, 1);
      while (lines[i] === "") lines.splice(i, 1);
      return { title: m[1].trim(), body: lines.join("\n") };
    }
    if (lines[i].trim() !== "") break;
  }
  return { title: null, body: md };
}

function isMhtml(filePath) {
  const head = readFileSync(filePath, { encoding: "utf8" }).slice(0, 8192);
  return /Content-Type:\s*multipart\/related/i.test(head);
}

function parseHeaders(headerBlock) {
  const headers = {};
  const lines = headerBlock.split(/\r?\n/);
  let prev = null;
  for (const line of lines) {
    if (/^[ \t]/.test(line) && prev) {
      headers[prev] += " " + line.trim();
    } else {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      headers[key] = value;
      prev = key;
    }
  }
  return headers;
}

function decodeQuotedPrintable(s) {
  const noBreaks = s.replace(/=\r?\n/g, "");
  const bytes = [];
  let i = 0;
  while (i < noBreaks.length) {
    if (noBreaks[i] === "=" && i + 2 < noBreaks.length) {
      const h = noBreaks.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(h)) {
        bytes.push(parseInt(h, 16));
        i += 3;
        continue;
      }
    }
    bytes.push(noBreaks.charCodeAt(i) & 0xff);
    i++;
  }
  return Buffer.from(bytes);
}

function detectImageExt(buf) {
  if (buf.length < 4) return "bin";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf.length > 11 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "webp";
  const head = buf.slice(0, 256).toString("utf8");
  if (head.includes("<svg") || head.includes("<?xml")) return "svg";
  return "bin";
}

function parseMhtml(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const boundaryMatch = raw.match(/boundary="([^"]+)"|boundary=([^\s;]+)/i);
  if (!boundaryMatch) throw new Error("MHTML: boundary not found");
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const sep = `--${boundary}`;
  const chunks = raw.split(sep);

  let html = null;
  const images = [];

  for (const chunk of chunks) {
    const trimmed = chunk.replace(/^\r?\n/, "");
    if (!trimmed || trimmed.startsWith("--") || trimmed.length < 10) continue;

    const blankIdx = trimmed.search(/\r?\n\r?\n/);
    if (blankIdx === -1) continue;
    const headerBlock = trimmed.slice(0, blankIdx);
    const bodyStart =
      blankIdx + (trimmed.slice(blankIdx, blankIdx + 4).startsWith("\r\n\r\n") ? 4 : 2);
    let body = trimmed.slice(bodyStart);
    body = body.replace(/\r?\n--\s*$/, "").replace(/\r?\n$/, "");

    const headers = parseHeaders(headerBlock);
    const ct = (headers["content-type"] || "").toLowerCase();
    const cte = (headers["content-transfer-encoding"] || "").toLowerCase();
    const loc = headers["content-location"] || "";

    let buffer;
    if (cte === "base64") {
      buffer = Buffer.from(body.replace(/\s+/g, ""), "base64");
    } else if (cte === "quoted-printable") {
      buffer = decodeQuotedPrintable(body);
    } else {
      buffer = Buffer.from(body, "utf8");
    }

    if (ct.startsWith("text/html")) {
      html = buffer.toString("utf8");
    } else if (loc) {
      images.push({ location: loc, buffer });
    }
  }

  if (!html) throw new Error("MHTML: no HTML part found");
  return { html, images };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function processMhtml(input, slug, mediaDir) {
  const { html, images } = parseMhtml(input);

  mkdirSync(mediaDir, { recursive: true });
  let rewritten = html;
  let saved = 0;
  images.forEach((img, i) => {
    const ext = detectImageExt(img.buffer);
    if (ext === "bin") return;
    const filename = `image-${String(i + 1).padStart(3, "0")}.${ext}`;
    const absPath = path.join(mediaDir, filename);
    writeFileSync(absPath, img.buffer);
    saved++;
    const basename = img.location.split(/[\\/]/).pop();
    const targets = new Set([img.location]);
    if (basename) targets.add(basename);
    for (const t of targets) {
      rewritten = rewritten.replace(
        new RegExp(escapeRegex(t), "g"),
        absPath,
      );
    }
  });

  const tmp = path.join(os.tmpdir(), `import-${process.pid}.html`);
  writeFileSync(tmp, rewritten, "utf8");
  return { htmlPath: tmp, savedImages: saved };
}

function convertDocToHtml(docPath) {
  const tmp = path.join(os.tmpdir(), `import-${process.pid}.html`);
  execFileSync("textutil", ["-convert", "html", docPath, "-output", tmp]);
  return tmp;
}

function runPandoc({ inputPath, mediaDir }) {
  const args = [inputPath, "-t", "gfm", "--wrap=none"];
  if (mediaDir) args.push(`--extract-media=${mediaDir}`);
  return execFileSync("pandoc", args, { encoding: "utf8" });
}

function rewriteMediaPaths(md, absMediaDir, slug) {
  const publicPrefix = `/imports/${slug}`;
  return md.replace(new RegExp(escapeRegex(absMediaDir), "g"), publicPrefix);
}

function cleanupConfluence(md) {
  let out = md;

  out = out.replace(/<\/?div\b[^>]*>/g, "");

  out = out.replace(
    /<span\s+class="confluence-[^"]*">([\s\S]*?)<\/span>/g,
    "$1",
  );

  out = out.replace(/<img\s+([^>]+?)\/?>/g, (_, attrs) => {
    const pick = (name) => {
      const m = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
      return m ? m[1] : null;
    };
    const src = pick("src");
    if (!src) return "";
    const alt = pick("alt") || "";
    return `![${alt}](${src})`;
  });

  out = out.replace(
    /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
    (_, href, text) => {
      const cleaned = text.replace(/<[^>]+>/g, "").trim();
      return `[${cleaned || href}](${href})`;
    },
  );

  out = out.replace(/```\s*syntaxhighlighter-pre/g, "```");

  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (!which("pandoc")) {
    fail("pandoc not found. Install with: brew install pandoc");
  }

  const input = path.resolve(args.input);
  if (!existsSync(input)) fail(`Not found: ${input}`);

  const ext = path.extname(input).toLowerCase();
  if (ext !== ".doc" && ext !== ".docx") {
    fail("Only .doc and .docx are supported.");
  }

  const baseName = path.basename(input, ext);
  const slug = args.slug || slugify(baseName);
  if (!slug) fail("Could not derive slug from filename. Pass --slug=foo.");

  const outPath = path.join(projectRoot, "content/posts", `${slug}.md`);
  if (existsSync(outPath) && !args.force) {
    fail(`Exists: ${path.relative(projectRoot, outPath)} (use --force)`);
  }

  const mediaDir = path.join(projectRoot, "public/imports", slug);
  if (existsSync(mediaDir)) rmSync(mediaDir, { recursive: true, force: true });

  const mhtml = ext === ".doc" && isMhtml(input);
  let pandocInput;
  let tmpHtml = null;
  let preExtracted = 0;

  if (mhtml) {
    const r = processMhtml(input, slug, mediaDir);
    pandocInput = r.htmlPath;
    tmpHtml = r.htmlPath;
    preExtracted = r.savedImages;
  } else if (ext === ".doc") {
    if (!which("textutil")) {
      fail("textutil not found (.doc requires macOS textutil).");
    }
    tmpHtml = convertDocToHtml(input);
    pandocInput = tmpHtml;
  } else {
    pandocInput = input;
  }

  let md;
  try {
    md = runPandoc({
      inputPath: pandocInput,
      mediaDir: mhtml ? null : path.join(mediaDir, "_pandoc"),
    });
  } finally {
    if (tmpHtml) rmSync(tmpHtml, { force: true });
  }

  md = rewriteMediaPaths(md, mediaDir, slug);
  md = cleanupConfluence(md);

  const { title: extractedTitle, body } = extractFirstH1(md);
  const decodedName = decodeURIComponent(baseName.replace(/\+/g, " ")).trim();
  const title = extractedTitle || decodedName;

  const frontmatter = buildFrontmatter({
    title,
    description: "",
    date: todayISO(),
  });

  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, frontmatter + body.trim() + "\n");

  console.log(`✓ Wrote ${path.relative(projectRoot, outPath)}`);
  if (existsSync(mediaDir)) {
    console.log(
      `✓ Media: public/imports/${slug}/ (${preExtracted} pre-extracted${mhtml ? " from MHTML" : ""})`,
    );
  }
  console.log("→ Fill in description, tags (and series fields if applicable).");
}

main();
