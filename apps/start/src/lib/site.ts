/**
 * 사이트 전역 메타 상수. SEO/GEO 관련 파일(루트 라우트, sitemap, robots, rss,
 * llms.txt, JSON-LD)이 모두 여기서 단일 소스를 참조한다.
 *
 * 이 모듈은 Vite 번들(브라우저·SSR)뿐 아니라 content-collections 설정(esbuild + Node)에서도
 * 읽힌다. 거기서는 `import.meta.env` 가 없으므로 process.env 로 떨어진다.
 */
function siteUrlFromEnv(): string | undefined {
  const fromVite: unknown = import.meta.env?.VITE_SITE_URL;
  if (typeof fromVite === "string" && fromVite) return fromVite;
  if (typeof process !== "undefined") return process.env.VITE_SITE_URL;
  return undefined;
}

export const SITE_URL = (siteUrlFromEnv() ?? "https://hovelopin.xyz").replace(/\/+$/, "");

export const SITE_NAME = "hovelopin — dev log";
export const SITE_SHORT_NAME = "hovelopin";
export const SITE_DESCRIPTION =
  "개발하면서 배운 것, 만든 것, 삽질한 것을 기록하는 개인 개발 블로그.";
export const SITE_LOCALE = "ko_KR";
export const SITE_LANG = "ko-KR";

export const AUTHOR = {
  name: "hovelopin",
  fullName: "Kim Hojin",
  url: SITE_URL,
  sameAs: ["https://github.com/hovelopin"],
} as const;

/** 상대 경로를 절대 URL로 변환한다. (OG 이미지·canonical·JSON-LD용) */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
