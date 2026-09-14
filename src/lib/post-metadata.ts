import type { Metadata } from "next";
import { getPostBySlug, hasPostTranslation } from "@/lib/content";
import { AUTHOR } from "@/lib/site";
import { LOCALE_META, localePath, type Locale } from "@/lib/locale";

/**
 * 글 상세 페이지 메타데이터.
 *
 * 번역본이 있을 때만 hreflang(alternates.languages)을 넣는다.
 * 없는 주소를 alternate 로 걸면 검색엔진이 404 를 물고 간다.
 */
export async function postMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const post = await getPostBySlug(slug, locale);
  if (!post) return {};

  const other: Locale = locale === "ko" ? "en" : "ko";
  const url = localePath(locale, `/articles/${slug}`);
  const images = post.cover ? [{ url: post.cover, alt: post.coverAlt ?? post.title }] : undefined;
  const languages = (await hasPostTranslation(slug, other))
    ? { [LOCALE_META[other].lang]: localePath(other, `/articles/${slug}`) }
    : undefined;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "article",
      url,
      locale: LOCALE_META[locale].ogLocale,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [post.author ?? AUTHOR.name],
      tags: post.tags,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}
