/**
 * 블로그가 지원하는 언어.
 *
 * 한국어가 기본이라 URL 에 접두사가 없다(`/articles/foo`). 영어만 `/en` 아래로
 * 들어간다(`/en/articles/foo`). 기본 언어에 접두사를 안 붙여 한국어 주소를 짧게 유지한다.
 *
 * 원문은 `content/posts/<slug>.mdx`, 번역본은 `content/posts/<slug>.en.mdx` 로
 * 나란히 둔다. 파일이 없으면 그 언어에는 그 글이 없는 것으로 친다 —
 * 영어 목록에 한국어 본문이 섞이는 것보다 아예 안 보이는 편이 낫다.
 */
export const LOCALES = ["ko", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

/** <html lang> 과 OpenGraph 에 쓰는 값. */
export const LOCALE_META: Record<Locale, { lang: string; ogLocale: string; label: string }> = {
  ko: { lang: "ko-KR", ogLocale: "ko_KR", label: "한국어" },
  en: { lang: "en-US", ogLocale: "en_US", label: "English" },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** 로케일에 맞는 경로를 만든다. 기본 언어는 접두사를 붙이지 않는다. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}

/** 마크다운 파일명 접미사. 기본 언어는 접미사가 없다. */
export function localeSuffix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `.${locale}`;
}
