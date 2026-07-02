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

export interface Post extends PostFrontmatter {
  slug: string;
  readingTimeMinutes: number;
  content: string;
  headings: Heading[];
}

export interface PostSummary extends PostFrontmatter {
  slug: string;
  readingTimeMinutes: number;
}

/**
 * research(오픈소스 탐구) 책장.
 * content/research/<book-slug>/book.md 가 책 메타(표지)이고,
 * 같은 폴더의 NN-*.md 파일들이 챕터가 된다.
 */
export interface BookFrontmatter {
  /** 책 제목. 표지 상단에 크게 노출된다. (예: "React") */
  title: string;
  /** 대상 저장소 owner/name. 표지 하단 "저자"처럼 노출된다. */
  repo?: string;
  /** 한 줄 소개. 책장 hover·상세 상단에 노출. */
  description: string;
  /** 마지막으로 손댄 날짜(YYYY-MM-DD). 정렬 기준. */
  date: string;
  /** 표지 배경색(oklch/hex). 없으면 slug 해시로 자동 배정. */
  color?: string;
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
  /** book.md 본문을 렌더한 HTML(서문/개요). 비어 있을 수 있다. */
  intro: string;
}

export interface Chapter {
  bookSlug: string;
  bookTitle: string;
  slug: string;
  title: string;
  order: number;
  content: string;
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
  content: string;
}
