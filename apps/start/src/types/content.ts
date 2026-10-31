/**
 * 화면 컴포넌트가 쓰는 콘텐츠 타입.
 * 원천은 content-collections 가 만든 문서이고, lib/content.ts 가 이 모양으로 다듬어 넘긴다.
 * 본문은 마크다운 원문이 아니라 compileMDX 결과(`body`)다.
 */
export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  author?: string;
  cover?: string;
  coverAlt?: string;
  linkPreviews?: Record<string, string>;
  series?: string;
  seriesOrder?: number;
  draft?: boolean;
}

export interface SeriesContext {
  series: string;
  posts: PostSummary[];
  currentIndex: number;
  prev: PostSummary | null;
  next: PostSummary | null;
}

export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface PostSummary extends PostFrontmatter {
  slug: string;
  readingTimeMinutes: number;
}

export interface Post extends PostSummary {
  body: string;
  headings: Heading[];
}

/**
 * research(오픈소스 탐구) 책장.
 * content/research/<book-slug>/book.mdx 가 책 메타(표지)이고,
 * 같은 폴더의 NN-*.mdx 파일들이 챕터가 된다.
 */
export interface BookFrontmatter {
  title: string;
  repo?: string;
  description: string;
  date: string;
  color?: string;
  coverImage?: string;
  sourceUrl?: string;
  tags?: string[];
  draft?: boolean;
}

export interface ChapterSummary {
  slug: string;
  title: string;
  order: number;
}

export interface BookSummary extends BookFrontmatter {
  slug: string;
  chapters: ChapterSummary[];
}

export interface Book extends BookSummary {
  /** book.mdx 본문(서문)의 컴파일 결과. 비어 있을 수 있다. */
  intro: string;
}

export interface Chapter {
  bookSlug: string;
  bookTitle: string;
  slug: string;
  title: string;
  order: number;
  body: string;
  headings: Heading[];
}

export interface ChapterContext {
  book: BookSummary;
  chapter: Chapter;
  prev: ChapterSummary | null;
  next: ChapterSummary | null;
  index: number;
}

export interface DiaryFrontmatter {
  date: string;
  mood?: string;
}

export interface DiaryEntry extends DiaryFrontmatter {
  slug: string;
  /** 마크다운을 걷어낸 한 줄 미리보기 */
  excerpt: string;
  body: string;
}
