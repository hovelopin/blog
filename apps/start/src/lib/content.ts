import {
  allBooks,
  allChapters,
  allDiaryEntries,
  allPosts,
  allPostsEns,
} from "content-collections";
import type {
  Book,
  BookSummary,
  ChapterContext,
  DiaryEntry,
  Post,
  PostSummary,
  SeriesContext,
} from "@/types/content";
import { DEFAULT_LOCALE, type Locale } from "./locale";

/**
 * 콘텐츠 조회. **서버에서만** import 한다 — 서버 함수 핸들러나 서버 라우트 안에서
 * `await import("@/lib/content")` 로 불러야 글 전체의 컴파일 결과가 클라이언트 번들에 섞이지 않는다.
 */

type PostDoc = (typeof allPosts)[number];

function byLocale(locale: Locale): readonly PostDoc[] {
  return locale === DEFAULT_LOCALE ? allPosts : allPostsEns;
}

// draft 글은 환경과 무관하게 목록·상세에서 항상 제외한다.
function visible(docs: readonly PostDoc[]): PostDoc[] {
  return docs.filter((p) => !p.draft);
}

function toSummary(p: PostDoc): PostSummary {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    tags: p.tags,
    author: p.author,
    cover: p.cover,
    coverAlt: p.coverAlt,
    series: p.series,
    seriesOrder: p.seriesOrder,
    draft: p.draft,
    readingTimeMinutes: p.readingTimeMinutes,
  };
}

export function getAllPostSummaries(locale: Locale = DEFAULT_LOCALE): PostSummary[] {
  return visible(byLocale(locale))
    .map(toSummary)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string, locale: Locale = DEFAULT_LOCALE): Post | null {
  const p = visible(byLocale(locale)).find((doc) => doc.slug === slug);
  if (!p) return null;
  return { ...toSummary(p), linkPreviews: p.linkPreviews, body: p.body, headings: p.headings };
}

/** 그 글의 해당 언어 번역본이 있는지. 글 안의 언어 전환 링크를 띄울지 정한다. */
export function hasPostTranslation(slug: string, locale: Locale): boolean {
  return visible(byLocale(locale)).some((p) => p.slug === slug);
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of getAllPostSummaries()) {
    for (const t of p.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getPostsByTag(tag: string): PostSummary[] {
  return getAllPostSummaries().filter((p) => (p.tags ?? []).includes(tag));
}

export function getSeriesContext(slug: string): SeriesContext | null {
  const posts = getAllPostSummaries();
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

export function getAdjacentPosts(slug: string): {
  prev: PostSummary | null;
  next: PostSummary | null;
} {
  const posts = getAllPostSummaries();
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return { next: posts[i - 1] ?? null, prev: posts[i + 1] ?? null };
}

export function getRelatedPosts(slug: string, tags: string[] | undefined, limit = 3): PostSummary[] {
  if (!tags || tags.length === 0) return [];
  const tagSet = new Set(tags);
  return getAllPostSummaries()
    .filter((p) => p.slug !== slug)
    .map((post) => ({ post, overlap: (post.tags ?? []).filter((t) => tagSet.has(t)).length }))
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map((x) => x.post);
}

// ---------------------------------------------------------------------------
// diary
// ---------------------------------------------------------------------------

export function getAllDiaryEntries(): DiaryEntry[] {
  return allDiaryEntries
    .filter((d): d is typeof d & { date: string } => typeof d.date === "string" && d.date !== "")
    .map((d) => ({ slug: d.slug, date: d.date, mood: d.mood, excerpt: d.excerpt, body: d.body }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getDiaryEntryBySlug(slug: string): DiaryEntry | null {
  return getAllDiaryEntries().find((d) => d.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// research 책장
// ---------------------------------------------------------------------------

function chaptersOf(bookSlug: string) {
  return allChapters
    .filter((c) => c.bookSlug === bookSlug)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

function toBookSummary(b: (typeof allBooks)[number]): BookSummary {
  return {
    slug: b.slug,
    title: b.title,
    repo: b.repo,
    description: b.description,
    date: b.date,
    color: b.color,
    coverImage: b.coverImage,
    sourceUrl: b.sourceUrl,
    tags: b.tags,
    draft: b.draft,
    chapters: chaptersOf(b.slug).map((c) => ({ slug: c.slug, title: c.title, order: c.order })),
  };
}

export function getAllBooks(): BookSummary[] {
  return allBooks
    .filter((b) => !b.draft)
    .map(toBookSummary)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getBookBySlug(slug: string): Book | null {
  const b = allBooks.find((doc) => doc.slug === slug && !doc.draft);
  if (!b) return null;
  return { ...toBookSummary(b), intro: b.intro };
}

export function getChapterContext(bookSlug: string, chapterSlug: string): ChapterContext | null {
  const book = getBookBySlug(bookSlug);
  if (!book) return null;
  const index = book.chapters.findIndex((c) => c.slug === chapterSlug);
  if (index < 0) return null;
  const doc = chaptersOf(bookSlug)[index];
  return {
    book,
    chapter: {
      bookSlug,
      bookTitle: book.title,
      slug: doc.slug,
      title: doc.title,
      order: doc.order,
      body: doc.body,
      headings: doc.headings,
    },
    prev: book.chapters[index - 1] ?? null,
    next: book.chapters[index + 1] ?? null,
    index,
  };
}
