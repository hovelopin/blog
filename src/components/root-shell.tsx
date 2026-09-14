import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackToTop } from "@/components/back-to-top";
import { ScrollProgress } from "@/components/scroll-progress";
import { CommandPalette } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";
import { getAllPostSummaries, getAllTags } from "@/lib/content";
import { LOCALE_META, type Locale } from "@/lib/locale";
// Pretendard 는 유니코드 구간별로 쪼갠 subset 을 쓴다.
// 방문자는 실제로 화면에 나온 글자가 속한 조각만 내려받는다.
// 폰트 파일은 npm 패키지가 아니라 public/fonts/pretendard 에 직접 넣어 두고 참조한다.
import "@/app/pretendard.css";
import "@/app/globals.css";

const themeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('theme');
    var d = s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

/**
 * 언어별 루트 레이아웃이 공유하는 껍데기.
 *
 * `<html lang>` 이 언어마다 달라야 해서 루트 레이아웃을 route group 으로 둘로
 * 나눴고(`(ko)` / `(en)`), 중복되는 본문 구조만 여기로 모았다.
 * 커맨드 팔레트 목록도 해당 언어의 글만 담는다.
 */
export async function RootShell({
  locale,
  children,
}: Readonly<{ locale: Locale; children: React.ReactNode }>) {
  const [posts, tags] = await Promise.all([getAllPostSummaries(locale), getAllTags()]);
  const paletteItems = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    date: p.date,
  }));

  return (
    <html lang={LOCALE_META[locale].lang} className="h-full antialiased" suppressHydrationWarning>
      {/* App Router 루트 레이아웃에서는 <head> 를 직접 쓰는 게 정상이다. */}
      {/* oxlint-disable-next-line nextjs/no-head-element */}
      <head>
        {/* 본문 폰트는 통짜 variable woff2 한 개라, 스타일 계산을 기다리지 않고 미리 받게 한다. */}
        <link
          rel="preload"
          href="/fonts/pretendard/PretendardVariable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ScrollProgress />
        <SiteHeader locale={locale} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
        <BackToTop />
        <CommandPalette posts={paletteItems} tags={tags} locale={locale} />
      </body>
    </html>
  );
}
