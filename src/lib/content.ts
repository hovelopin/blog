import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";
import { visit } from "unist-util-visit";
import type { Root as MdastRoot, Heading as MdastHeading } from "mdast";
import type {
  Book,
  BookFrontmatter,
  BookSummary,
  Chapter,
  ChapterContext,
  ChapterSummary,
  DiaryEntry,
  DiaryFrontmatter,
  Heading,
  Post,
  PostFrontmatter,
  PostSummary,
  SeriesContext,
} from "@/types/content";

const contentRoot = path.join(process.cwd(), "content");
const postsDir = path.join(contentRoot, "posts");
const diaryDir = path.join(contentRoot, "diary");
const researchDir = path.join(contentRoot, "research");
const publicDir = path.join(process.cwd(), "public");

// frontmatter 의 cover 가 public/ 아래 실제로 없는 파일을 가리키는 경우가 있다.
// 그대로 넘기면 목록에서 깨진 이미지가 뜨므로, 파일이 없으면 없는 셈 친다.
// (외부 URL 은 확인할 수 없으니 그대로 통과)
async function resolveCover(cover?: string): Promise<string | undefined> {
  if (!cover) return undefined;
  if (!cover.startsWith("/")) return cover;
  try {
    await fs.access(path.join(publicDir, cover.slice(1)));
    return cover;
  } catch {
    return undefined;
  }
}

// draft 글은 환경(로컬/프로덕션)과 무관하게 목록·상세에서 항상 제외한다.
// md 파일은 저장소에 그대로 두고, frontmatter의 draft 속성으로만 노출 여부를 제어한다.
function isPostVisible(fm: Pick<PostFrontmatter, "draft">): boolean {
  return !fm.draft;
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
      .map((entry) => entry.name);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/, "");
}

/**
 * 본문에서 h2·h3 만 뽑아 목차를 만든다.
 * id 는 rehype-slug 와 같은 github-slugger 로 만들어 본문 heading 의 id 와 맞춘다.
 */
function extractHeadings(source: string): Heading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source) as MdastRoot;
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  visit(tree, "heading", (node: MdastHeading) => {
    if (node.depth !== 2 && node.depth !== 3) return;
    let text = "";
    visit(node, (child) => {
      if (child.type === "text" || child.type === "inlineCode") {
        text += (child as { value: string }).value;
      }
    });
    text = text.trim();
    if (!text) return;
    headings.push({ id: slugger.slug(text), text, depth: node.depth === 2 ? 2 : 3 });
  });
  return headings;
}

export async function getAllPostSummaries(): Promise<PostSummary[]> {
  const files = await listMarkdownFiles(postsDir);
  const summaries: (PostSummary | null)[] = await Promise.all(
    files.map(async (filename): Promise<PostSummary | null> => {
      const raw = await fs.readFile(path.join(postsDir, filename), "utf8");
      const { data, content } = matter(raw);
      const fm = data as PostFrontmatter;
      if (!isPostVisible(fm)) return null;
      const stats = readingTime(content);
      return {
        slug: slugFromFilename(filename),
        title: fm.title,
        description: fm.description,
        date: fm.date,
        tags: fm.tags,
        author: fm.author,
        cover: await resolveCover(fm.cover),
        coverAlt: fm.coverAlt,
        series: fm.series,
        seriesOrder: fm.seriesOrder,
        draft: fm.draft,
        readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
      } satisfies PostSummary;
    }),
  );
  return summaries
    .filter((s): s is PostSummary => s !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDir, `${slug}.mdx`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  if (!isPostVisible(fm)) return null;
  const stats = readingTime(content);
  const headings = extractHeadings(content);
  return {
    slug,
    title: fm.title,
    description: fm.description,
    date: fm.date,
    tags: fm.tags,
    author: fm.author,
    cover: await resolveCover(fm.cover),
    coverAlt: fm.coverAlt,
    series: fm.series,
    seriesOrder: fm.seriesOrder,
    draft: fm.draft,
    readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
    // MDX 원본. 렌더는 페이지에서 MDXRemote 가 맡는다.
    content,
    headings,
  } satisfies Post;
}

export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getAllPostSummaries();
  return posts.map((p) => p.slug);
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
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

export async function getSeriesContext(slug: string): Promise<SeriesContext | null> {
  const posts = await getAllPostSummaries();
  const current = posts.find((p) => p.slug === slug);
  if (!current?.series) return null;
  const seriesPosts = posts
    .filter((p) => p.series === current.series)
    .sort((a, b) => {
      const ao = a.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.date.localeCompare(b.date);
    });
  if (seriesPosts.length < 2) return null;
  const currentIndex = seriesPosts.findIndex((p) => p.slug === slug);
  return {
    series: current.series,
    posts: seriesPosts,
    currentIndex,
    prev: seriesPosts[currentIndex - 1] ?? null,
    next: seriesPosts[currentIndex + 1] ?? null,
  };
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
    .sort((a, b) => b.overlap - a.overlap || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map((x) => x.post);
}

async function readDiaryFile(filename: string): Promise<DiaryEntry | null> {
  const raw = await fs.readFile(path.join(diaryDir, filename), "utf8");
  const { data, content } = matter(raw);
  const fm = data as DiaryFrontmatter;
  // 날짜가 없는(아직 작성 중인) 항목은 목록/링크에서 제외한다.
  if (!fm.date) return null;
  return {
    slug: slugFromFilename(filename),
    date: fm.date,
    mood: fm.mood,
    content,
  } satisfies DiaryEntry;
}

export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  const files = await listMarkdownFiles(diaryDir);
  const entries = (await Promise.all(files.map(readDiaryFile))).filter(
    (e): e is DiaryEntry => e !== null,
  );
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDiaryEntryBySlug(slug: string): Promise<DiaryEntry | null> {
  try {
    return await readDiaryFile(`${slug}.mdx`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function getAllDiarySlugs(): Promise<string[]> {
  const entries = await getAllDiaryEntries();
  return entries.map((e) => e.slug);
}

// ---------------------------------------------------------------------------
// research(오픈소스 탐구) 책장
// content/research/<book-slug>/book.md = 책 메타(표지) + 서문 본문
// 같은 폴더의 NN-*.md = 챕터(파일명 앞 숫자로 정렬)
// ---------------------------------------------------------------------------

async function listBookDirs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(researchDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

function chapterOrderFromFilename(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

// "01-render-architecture.mdx" -> "제목 미지정" 대체용 사람이 읽을 문자열
function titleFromChapterFilename(filename: string): string {
  return slugFromFilename(filename)
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

async function readBookChapters(
  bookSlug: string,
): Promise<{ filename: string; summary: ChapterSummary }[]> {
  const dir = path.join(researchDir, bookSlug);
  const files = (await listMarkdownFiles(dir)).filter((name) => name !== "book.mdx");
  const chapters = await Promise.all(
    files.map(async (filename) => {
      const raw = await fs.readFile(path.join(dir, filename), "utf8");
      const { data } = matter(raw);
      const fm = data as { title?: string };
      const slug = slugFromFilename(filename);
      return {
        filename,
        summary: {
          slug,
          title: fm.title ?? titleFromChapterFilename(filename) ?? slug,
          order: chapterOrderFromFilename(filename),
        } satisfies ChapterSummary,
      };
    }),
  );
  return chapters.sort(
    (a, b) => a.summary.order - b.summary.order || a.summary.slug.localeCompare(b.summary.slug),
  );
}

async function readBookSummary(bookSlug: string): Promise<BookSummary | null> {
  const bookPath = path.join(researchDir, bookSlug, "book.mdx");
  let raw: string;
  try {
    raw = await fs.readFile(bookPath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
  const { data } = matter(raw);
  const fm = data as BookFrontmatter;
  if (fm.draft) return null;
  const chapters = (await readBookChapters(bookSlug)).map((c) => c.summary);
  return {
    slug: bookSlug,
    title: fm.title,
    repo: fm.repo,
    description: fm.description,
    date: fm.date,
    color: fm.color,
    coverImage: fm.coverImage,
    sourceUrl: fm.sourceUrl,
    tags: fm.tags,
    draft: fm.draft,
    chapters,
  } satisfies BookSummary;
}

export async function getAllBooks(): Promise<BookSummary[]> {
  const dirs = await listBookDirs();
  const books = (await Promise.all(dirs.map(readBookSummary))).filter(
    (b): b is BookSummary => b !== null,
  );
  return books.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAllBookSlugs(): Promise<string[]> {
  const books = await getAllBooks();
  return books.map((b) => b.slug);
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const summary = await readBookSummary(slug);
  if (!summary) return null;
  const bookPath = path.join(researchDir, slug, "book.mdx");
  const raw = await fs.readFile(bookPath, "utf8");
  const { content } = matter(raw);
  const intro = content.trim() ? content : "";
  return { ...summary, intro } satisfies Book;
}

export async function getAllChapterParams(): Promise<{ book: string; chapter: string }[]> {
  const dirs = await listBookDirs();
  const params = await Promise.all(
    dirs.map(async (bookSlug) => {
      const summary = await readBookSummary(bookSlug);
      if (!summary) return [];
      return summary.chapters.map((c) => ({
        book: bookSlug,
        chapter: c.slug,
      }));
    }),
  );
  return params.flat();
}

export async function getChapterContext(
  bookSlug: string,
  chapterSlug: string,
): Promise<ChapterContext | null> {
  const summary = await readBookSummary(bookSlug);
  if (!summary) return null;
  const index = summary.chapters.findIndex((c) => c.slug === chapterSlug);
  if (index < 0) return null;

  const filePath = path.join(researchDir, bookSlug, `${chapterSlug}.mdx`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
  const { data, content } = matter(raw);
  const fm = data as { title?: string };
  const headings = extractHeadings(content);
  const meta = summary.chapters[index];

  const chapter: Chapter = {
    bookSlug,
    bookTitle: summary.title,
    slug: chapterSlug,
    title: fm.title ?? meta.title,
    order: meta.order,
    content,
    headings,
  };

  return {
    book: summary,
    chapter,
    prev: summary.chapters[index - 1] ?? null,
    next: summary.chapters[index + 1] ?? null,
    index,
  } satisfies ChapterContext;
}
