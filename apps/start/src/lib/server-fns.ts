import { createServerFn } from "@tanstack/react-start";
import type {
  Book,
  BookSummary,
  ChapterContext,
  DiaryEntry,
  Post,
  PostSummary,
  SeriesContext,
} from "@/types/content";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locale";

/**
 * 라우트 로더가 부르는 서버 함수.
 *
 * 콘텐츠 모듈은 핸들러 안에서 동적 import 한다. 라우트가 `content-collections` 를
 * 직접 import 하면 글 전체의 컴파일 결과(≈1.1MB)가 클라이언트 번들에 실린다.
 * 프리렌더 때는 빌드 시점에 실행되고 결과만 HTML 에 박히므로 런타임 호출은 거의 없다.
 */
const content = () => import("@/lib/content");

const asLocale = (value: unknown): Locale =>
  typeof value === "string" && isLocale(value) ? value : DEFAULT_LOCALE;

export type PalettePost = Pick<PostSummary, "slug" | "title" | "description" | "tags" | "date">;

export interface PaletteData {
  /** 언어별 글 목록. 루트 레이아웃이 한 번 받아 두고 /en ↔ / 를 오갈 때 바꿔 쓴다. */
  posts: Record<Locale, PalettePost[]>;
  tags: { tag: string; count: number }[];
}

/** 루트 레이아웃(커맨드 팔레트)용. */
export const getPaletteData = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaletteData> => {
    const c = await content();
    const pick = (locale: Locale): PalettePost[] =>
      c.getAllPostSummaries(locale).map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        tags: p.tags,
        date: p.date,
      }));
    return { posts: { ko: pick("ko"), en: pick("en") }, tags: c.getAllTags() };
  },
);

export interface HomeData {
  posts: PostSummary[];
  diary: DiaryEntry[];
  books: BookSummary[];
}

export const getHomeData = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const c = await content();
  return { posts: c.getAllPostSummaries(), diary: c.getAllDiaryEntries(), books: c.getAllBooks() };
});

export const getPostsIndex = createServerFn({ method: "GET" })
  .validator(asLocale)
  .handler(async ({ data: locale }) => {
    const c = await content();
    return { posts: c.getAllPostSummaries(locale), tags: c.getAllTags() };
  });

export interface PostPageData {
  post: Post;
  hasOther: boolean;
  prev: PostSummary | null;
  next: PostSummary | null;
  related: PostSummary[];
  series: SeriesContext | null;
}

export const getPostPage = createServerFn({ method: "GET" })
  .validator((d: { slug: string; locale: string }) => d)
  .handler(async ({ data }): Promise<PostPageData | null> => {
    const c = await content();
    const locale = asLocale(data.locale);
    const post = c.getPostBySlug(data.slug, locale);
    if (!post) return null;
    const other: Locale = locale === "ko" ? "en" : "ko";
    return {
      post,
      hasOther: c.hasPostTranslation(data.slug, other),
      ...c.getAdjacentPosts(data.slug),
      related: c.getRelatedPosts(data.slug, post.tags),
      series: c.getSeriesContext(data.slug),
    };
  });

export const getPostsByTag = createServerFn({ method: "GET" })
  .validator((tag: string) => tag)
  .handler(async ({ data: tag }): Promise<PostSummary[]> => {
    const c = await content();
    return c.getPostsByTag(tag);
  });

export const getBooks = createServerFn({ method: "GET" }).handler(async (): Promise<BookSummary[]> => {
  const c = await content();
  return c.getAllBooks();
});

export const getBook = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<Book | null> => {
    const c = await content();
    return c.getBookBySlug(slug);
  });

export const getChapter = createServerFn({ method: "GET" })
  .validator((d: { book: string; chapter: string }) => d)
  .handler(async ({ data }): Promise<ChapterContext | null> => {
    const c = await content();
    return c.getChapterContext(data.book, data.chapter);
  });

export const getDiaryEntries = createServerFn({ method: "GET" }).handler(
  async (): Promise<DiaryEntry[]> => {
    const c = await content();
    return c.getAllDiaryEntries();
  },
);

export const getDiaryEntry = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<DiaryEntry | null> => {
    const c = await content();
    return c.getDiaryEntryBySlug(slug);
  });
