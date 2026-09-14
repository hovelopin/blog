/**
 * 본문 링크의 미리보기 스크린샷을 빌드 시점에 찍는다.
 *
 *   content/**\/*.mdx 의 링크 수집
 *     → 캐시에 있으면 재사용, 없으면 헤드리스 Chrome 으로 촬영
 *     → public/images/link-previews/ 로 출력 + manifest.json
 *
 * 촬영은 Chrome 의 `--screenshot` 플래그만 쓴다. puppeteer 가 필요 없다.
 * 1200x750 으로 그려서 데스크톱 레이아웃을 유지하되 배율 0.5 로 내보내
 * 600x375 파일이 나온다(카드 표시 크기의 약 2.4배).
 *
 * 캐시는 .next/cache 아래 둔다. Vercel 이 이 디렉터리를 빌드 간에 보존하므로
 * 두 번째 배포부터는 새로 생긴 링크만 찍는다.
 *
 * 한 장이라도 실패해도 빌드를 세우지 않는다. 미리보기는 부가 기능이다.
 */
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const OUT_DIR = path.join(ROOT, "public", "images", "link-previews");
const CACHE_DIR = path.join(ROOT, ".next", "cache", "link-previews");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hovelopin.xyz").replace(/\/+$/, "");

/** 페이지가 그려질 논리 크기. 이 값이 커야 모바일 레이아웃으로 안 바뀐다. */
const VIEWPORT = { width: 1200, height: 750 };
/** 출력 배율. 0.5 면 600x375 파일이 나온다. */
const SCALE = 0.5;
/** 한 장에 허용하는 시간. SPA 문서 사이트는 40초를 넘기기도 한다. */
const SHOT_TIMEOUT_MS = 60_000;
/** 동시에 띄우는 Chrome 개수. 빌드 컨테이너 메모리를 고려해 낮게 잡는다. */
const CONCURRENCY = 3;

/** 찍어봐야 의미가 없거나 막히는 곳. */
const SKIP_HOSTS = [/^localhost$/, /^127\./, /^192\.168\./, /^10\./];

function isSkippable(url) {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return true;
    return SKIP_HOSTS.some((re) => re.test(hostname));
  } catch {
    return true;
  }
}

/**
 * 실제로 촬영할 주소. 해시(#section)가 붙어 있으면 Chrome 이 렌더를 끝내지 못하고
 * 빈 이미지를 남긴다. 작은 썸네일에 앵커는 의미도 없으므로 떼고 찍는다.
 * 덕분에 같은 페이지의 여러 앵커가 한 장을 공유한다.
 */
function shotUrl(url) {
  const u = new URL(url);
  u.hash = "";
  return u.toString();
}

/** 같은 페이지는 항상 같은 파일명을 갖는다. */
function keyFor(url) {
  return createHash("sha1").update(shotUrl(url)).digest("hex").slice(0, 16);
}

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) yield full;
  }
}

/**
 * 본문에 실제로 걸린 링크만 모은다.
 * frontmatter, 코드 블록, 이미지(`![]()`)는 제외한다.
 */
async function collectLinks() {
  const urls = new Set();
  for await (const file of walk(CONTENT_DIR)) {
    let body = await fs.readFile(file, "utf8");
    body = body.replace(/^---[\s\S]*?^---/m, "");
    body = body.replace(/```[\s\S]*?```/g, "");
    body = body.replace(/`[^`\n]*`/g, "");
    for (const m of body.matchAll(/(!?)\[[^\]]*\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g)) {
      const [, bang, href] = m;
      if (bang) continue; // 이미지
      const url = href.startsWith("/") ? `${SITE_URL}${href}` : href;
      if (!isSkippable(url)) urls.add(url);
    }
  }
  return [...urls].toSorted();
}

/** 설치 없이 쓸 수 있는 Chrome 을 먼저 찾고, 없으면 번들 크로미움을 쓴다. */
async function resolveChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      await fs.access(c);
      return c;
    } catch {
      /* 다음 후보로 */
    }
  }

  // Vercel 빌드 컨테이너에는 Chrome 이 없다. 서버리스용 크로미움을 푼다.
  const { default: chromium } = await import("@sparticuz/chromium");
  return chromium.executablePath();
}

async function capture(chrome, url, dest) {
  await run(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--virtual-time-budget=5000",
      `--force-device-scale-factor=${SCALE}`,
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      `--screenshot=${dest}`,
      shotUrl(url),
    ],
    { timeout: SHOT_TIMEOUT_MS },
  );
  const { size } = await fs.stat(dest);
  // 빈 페이지나 오류 화면은 파일이 유난히 작다.
  if (size < 3000) throw new Error(`too small (${size}B)`);
}

async function main() {
  const urls = await collectLinks();
  if (urls.length === 0) {
    console.log("[link-previews] 대상 링크 없음");
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });

  let chrome = null;
  const manifest = {};
  let fresh = 0;
  let cached = 0;
  const failed = [];

  chrome = await resolveChrome();

  // 앵커만 다른 주소는 한 장을 공유하므로 촬영 단위로 먼저 묶는다.
  const byKey = new Map();
  for (const url of urls) {
    const key = keyFor(url);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(url);
  }

  const jobs = [...byKey.entries()];
  let next = 0;

  const worker = async () => {
    while (next < jobs.length) {
      const [key, sameShot] = jobs[next++];
      const name = `${key}.png`;
      const cachePath = path.join(CACHE_DIR, name);

      let ok = true;
      try {
        await fs.access(cachePath);
        cached++;
      } catch {
        try {
          await capture(chrome, sameShot[0], cachePath);
          fresh++;
        } catch (e) {
          failed.push(`${shotUrl(sameShot[0])} — ${e.message.split("\n")[0]}`);
          ok = false;
        }
      }
      if (!ok) continue;

      await fs.copyFile(cachePath, path.join(OUT_DIR, name));
      for (const u of sameShot) manifest[u] = `/images/link-previews/${name}`;
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await fs.writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `[link-previews] ${Object.keys(manifest).length}/${urls.length}장 준비 ` +
      `(새로 ${fresh}, 캐시 ${cached}, 실패 ${failed.length})`,
  );
  for (const f of failed) console.log(`  건너뜀: ${f}`);
}

await main();
