import type { Metadata } from "next";
import {
  AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_URL,
} from "@/lib/site";
import { LOCALE_META, localePath, type Locale } from "@/lib/locale";

/** 언어별 사이트 소개. 영어권 독자에게는 영어로 보여준다. */
const DESCRIPTION: Record<Locale, string> = {
  ko: SITE_DESCRIPTION,
  en: "A developer blog on what I learned, built, and debugged along the way.",
};

/**
 * 루트 레이아웃이 쓰는 사이트 전역 메타데이터.
 * 두 언어가 같은 값을 쓰되 locale·RSS 경로·설명만 갈라진다.
 */
export function siteMetadata(locale: Locale): Metadata {
  const description = DESCRIPTION[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: "%s — hovelopin",
    },
    description,
    applicationName: SITE_SHORT_NAME,
    authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
    creator: AUTHOR.name,
    publisher: AUTHOR.name,
    alternates: {
      types: {
        "application/rss+xml": localePath(locale, "/rss.xml"),
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: LOCALE_META[locale].ogLocale,
      url: localePath(locale, "/"),
      title: SITE_NAME,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}
