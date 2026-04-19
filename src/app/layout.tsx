import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackToTop } from "@/components/back-to-top";
import { ScrollProgress } from "@/components/scroll-progress";
import { CommandPalette } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";
import { getAllPostSummaries, getAllTags } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "hovelopin — dev log",
    template: "%s — hovelopin",
  },
  description:
    "개발하면서 배운 것, 만든 것, 삽질한 것을 기록하는 개인 개발 블로그.",
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

const themeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('theme');
    var d = s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [posts, tags] = await Promise.all([
    getAllPostSummaries(),
    getAllTags(),
  ]);
  const paletteItems = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    date: p.date,
  }));

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ScrollProgress />
        <SiteHeader />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
        <BackToTop />
        <CommandPalette posts={paletteItems} tags={tags} />
      </body>
    </html>
  );
}
