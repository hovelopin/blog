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

export interface DiaryFrontmatter {
  date: string;
  mood?: string;
}

export interface DiaryEntry extends DiaryFrontmatter {
  slug: string;
  content: string;
}
