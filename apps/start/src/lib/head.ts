import type { Post } from "@/types/content";
import { LOCALE_META, localePath, type Locale } from "./locale";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME, SITE_URL, absoluteUrl } from "./site";

/**
 * 라우트 `head()` 가 돌려주는 meta/link 를 만드는 헬퍼.
 * Next 의 Metadata 객체 대신 태그 목록을 직접 쓴다.
 */
export type Meta = Record<string, string>;
export type LinkTag = Record<string, string>;

export const pageTitle = (title: string) => `${title} — ${SITE_SHORT_NAME}`;

/** 언어별 사이트 소개. 영어권 독자에게는 영어로 보여준다. */
const DESCRIPTION: Record<Locale, string> = {
  ko: SITE_DESCRIPTION,
  en: "A developer blog on what I learned, built, and debugged along the way.",
};

/** 루트 레이아웃용. 페이지가 같은 name/property 를 다시 내면 TanStack 이 뒤의 것으로 덮는다. */
export function siteHead(locale: Locale): { meta: Meta[]; links: LinkTag[] } {
  const description = DESCRIPTION[locale];
  return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_NAME },
      { name: "description", content: description },
      { name: "application-name", content: SITE_SHORT_NAME },
      { name: "author", content: AUTHOR.name },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: LOCALE_META[locale].ogLocale },
      { property: "og:url", content: absoluteUrl(localePath(locale, "/")) },
      { property: "og:title", content: SITE_NAME },
      { property: "og:description", content: description },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_NAME },
      { name: "twitter:description", content: description },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: SITE_NAME,
        href: `${SITE_URL}/rss.xml`,
      },
      {
        rel: "preload",
        href: "/fonts/pretendard/PretendardVariable.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  };
}

interface PageHeadOptions {
  title: string;
  description: string;
  /** 사이트 기준 경로. canonical 과 og:url 에 쓴다. */
  path: string;
  type?: "website" | "article" | "book";
  image?: { url: string; alt?: string };
  /** hreflang 대체 경로. 번역본이 있을 때만 넣는다. */
  alternates?: { lang: string; path: string }[];
  article?: { publishedTime: string; author: string; tags?: string[] };
}

export function pageHead(o: PageHeadOptions): { meta: Meta[]; links: LinkTag[] } {
  const title = pageTitle(o.title);
  const url = absoluteUrl(o.path);
  const meta: Meta[] = [
    { title },
    { name: "description", content: o.description },
    { property: "og:type", content: o.type ?? "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: o.title },
    { property: "og:description", content: o.description },
    { name: "twitter:title", content: o.title },
    { name: "twitter:description", content: o.description },
  ];
  if (o.image) {
    meta.push(
      { property: "og:image", content: absoluteUrl(o.image.url) },
      { name: "twitter:image", content: absoluteUrl(o.image.url) },
    );
    if (o.image.alt) meta.push({ property: "og:image:alt", content: o.image.alt });
  }
  if (o.article) {
    meta.push(
      { property: "article:published_time", content: o.article.publishedTime },
      { property: "article:modified_time", content: o.article.publishedTime },
      { property: "article:author", content: o.article.author },
      ...(o.article.tags ?? []).map((t) => ({ property: "article:tag", content: t })),
    );
  }
  const links: LinkTag[] = [{ rel: "canonical", href: url }];
  for (const alt of o.alternates ?? []) {
    links.push({ rel: "alternate", hrefLang: alt.lang, href: absoluteUrl(alt.path) });
  }
  return { meta, links };
}

/**
 * 글 상세 페이지 메타데이터.
 * 번역본이 있을 때만 hreflang 을 넣는다. 없는 주소를 alternate 로 걸면 검색엔진이 404 를 물고 간다.
 */
export function postHead(post: Post, locale: Locale, hasOther: boolean) {
  const other: Locale = locale === "ko" ? "en" : "ko";
  return pageHead({
    title: post.title,
    description: post.description,
    path: localePath(locale, `/articles/${post.slug}`),
    type: "article",
    image: post.cover ? { url: post.cover, alt: post.coverAlt ?? post.title } : undefined,
    alternates: hasOther
      ? [{ lang: LOCALE_META[other].lang, path: localePath(other, `/articles/${post.slug}`) }]
      : undefined,
    article: { publishedTime: post.date, author: post.author ?? AUTHOR.name, tags: post.tags },
  });
}
