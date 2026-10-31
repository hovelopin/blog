import type { ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from "@tanstack/react-router";
import { Link } from "@/components/link";
import { BackToTop } from "@/components/back-to-top";
import { ColorWash } from "@/components/color-wash";
import { CommandPalette } from "@/components/command-palette";
import { DemoBootstrap } from "@/components/demo-bootstrap";
import { PageTransition } from "@/components/page-transition";
import { ScrollProgress } from "@/components/scroll-progress";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteHead } from "@/lib/head";
import { LOCALE_META, localeFromPath } from "@/lib/locale";
import { getPaletteData } from "@/lib/server-fns";
import globalsCss from "../styles/globals.css?url";
import pretendardCss from "../styles/pretendard.css?url";

/**
 * 첫 페인트 전에 저장된 테마를 적용한다.
 * 다크 사용자가 밝은 화면을 한 번 보고 나서 어두워지는 깜빡임을 막는다.
 */
const themeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('theme');
    var d = s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export const Route = createRootRoute({
  // 커맨드 팔레트가 두 언어의 글 목록을 다 들고 있어야 /en ↔ / 를 오갈 때 다시 안 불러도 된다.
  loader: () => getPaletteData(),
  head: ({ match }) => {
    const { meta, links } = siteHead(localeFromPath(match.pathname));
    return {
      meta,
      links: [
        ...links,
        { rel: "stylesheet", href: pretendardCss },
        { rel: "stylesheet", href: globalsCss },
      ],
    };
  },
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const locale = localeFromPath(pathname);
  const palette = Route.useLoaderData();

  return (
    <html lang={LOCALE_META[locale].lang} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
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
        <CommandPalette posts={palette.posts[locale]} tags={palette.tags} locale={locale} />
        <ColorWash />
        <DemoBootstrap />
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 sm:py-24">
      <p className="mb-3 font-mono text-xs text-primary">~/hovelopin $ cat 404.md</p>
      <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
        No such file or directory
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">찾는 페이지가 없다. 주소를 다시 확인해보자.</p>
      <Link href="/" className="font-mono text-xs text-primary hover:underline">
        ← cd ~
      </Link>
    </div>
  );
}
