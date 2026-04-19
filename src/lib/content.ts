import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element, Text } from "hast";
import type {
  DiaryEntry,
  DiaryFrontmatter,
  Heading,
  Post,
  PostFrontmatter,
  PostSummary,
} from "@/types/content";

const contentRoot = path.join(process.cwd(), "content");
const postsDir = path.join(contentRoot, "posts");
const diaryDir = path.join(contentRoot, "diary");

async function listMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, "");
}

async function renderMarkdown(source: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      theme: "github-dark-dimmed",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(source);
  return String(file);
}

function collectHeadingsPlugin(bucket: Heading[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = typeof node.properties?.id === "string" ? node.properties.id : null;
      if (!id) return;
      let text = "";
      visit(node, "text", (t: Text) => {
        text += t.value;
      });
      bucket.push({
        id,
        text: text.trim(),
        depth: node.tagName === "h2" ? 2 : 3,
      });
    });
  };
}

function linkPreviewPlugin(map: Record<string, string> | undefined) {
  return () => (tree: Root) => {
    if (!map || Object.keys(map).length === 0) return;
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string") return;
      const src = map[href];
      if (!src) return;
      node.properties = { ...node.properties, dataPreviewSrc: src };
    });
  };
}

async function renderPostMarkdown(
  source: string,
  linkPreviews?: Record<string, string>,
): Promise<{ html: string; headings: Heading[] }> {
  const headings: Heading[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(collectHeadingsPlugin(headings))
    .use(linkPreviewPlugin(linkPreviews))
    .use(rehypePrettyCode, {
      theme: "github-dark-dimmed",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(source);
  return { html: String(file), headings };
}

export async function getAllPostSummaries(): Promise<PostSummary[]> {
  const files = await listMarkdownFiles(postsDir);
  const summaries = await Promise.all(
    files.map(async (filename) => {
      const raw = await fs.readFile(path.join(postsDir, filename), "utf8");
      const { data, content } = matter(raw);
      const fm = data as PostFrontmatter;
      const stats = readingTime(content);
      return {
        slug: slugFromFilename(filename),
        title: fm.title,
        description: fm.description,
        date: fm.date,
        tags: fm.tags,
        author: fm.author,
        cover: fm.cover,
        coverAlt: fm.coverAlt,
        readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
      } satisfies PostSummary;
    }),
  );
  return summaries.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDir, `${slug}.md`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  const stats = readingTime(content);
  const { html, headings } = await renderPostMarkdown(content, fm.linkPreviews);
  return {
    slug,
    title: fm.title,
    description: fm.description,
    date: fm.date,
    tags: fm.tags,
    author: fm.author,
    cover: fm.cover,
    coverAlt: fm.coverAlt,
    readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
    content: html,
    headings,
  } satisfies Post;
}

export async function getAllPostSlugs(): Promise<string[]> {
  const files = await listMarkdownFiles(postsDir);
  return files.map(slugFromFilename);
}

export async function getAllTags(): Promise<
  { tag: string; count: number }[]
> {
  const posts = await getAllPostSummaries();
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPostsByTag(tag: string): Promise<PostSummary[]> {
  const posts = await getAllPostSummaries();
  return posts.filter((p) => (p.tags ?? []).includes(tag));
}

export async function getAdjacentPosts(
  slug: string,
): Promise<{ prev: PostSummary | null; next: PostSummary | null }> {
  const posts = await getAllPostSummaries();
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    next: posts[i - 1] ?? null,
    prev: posts[i + 1] ?? null,
  };
}

export async function getRelatedPosts(
  slug: string,
  tags: string[] | undefined,
  limit = 3,
): Promise<PostSummary[]> {
  if (!tags || tags.length === 0) return [];
  const tagSet = new Set(tags);
  const posts = await getAllPostSummaries();
  return posts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const overlap = (p.tags ?? []).filter((t) => tagSet.has(t)).length;
      return { post: p, overlap };
    })
    .filter((x) => x.overlap > 0)
    .sort(
      (a, b) =>
        b.overlap - a.overlap || b.post.date.localeCompare(a.post.date),
    )
    .slice(0, limit)
    .map((x) => x.post);
}

export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  const files = await listMarkdownFiles(diaryDir);
  const entries = await Promise.all(
    files.map(async (filename) => {
      const raw = await fs.readFile(path.join(diaryDir, filename), "utf8");
      const { data, content } = matter(raw);
      const fm = data as DiaryFrontmatter;
      const html = await renderMarkdown(content);
      return {
        slug: slugFromFilename(filename),
        date: fm.date,
        mood: fm.mood,
        content: html,
      } satisfies DiaryEntry;
    }),
  );
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
