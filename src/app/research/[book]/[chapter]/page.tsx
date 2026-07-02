import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, List } from "lucide-react";
import { PostContent } from "@/components/post-content";
import { DynamicIslandTOC } from "@/components/dynamic-island-toc";
import { JsonLd } from "@/components/json-ld";
import { getAllChapterParams, getChapterContext } from "@/lib/content";
import { AUTHOR, SITE_LANG, absoluteUrl } from "@/lib/site";

interface ChapterPageProps {
  params: Promise<{ book: string; chapter: string }>;
}

export async function generateStaticParams() {
  return getAllChapterParams();
}

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  const { book: bookSlug, chapter: chapterSlug } = await params;
  const ctx = await getChapterContext(bookSlug, chapterSlug);
  if (!ctx) return {};
  const url = `/research/${bookSlug}/${chapterSlug}`;
  const title = `${ctx.chapter.title} — ${ctx.book.title}`;
  return {
    title,
    description: ctx.book.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: ctx.book.description,
    },
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { book: bookSlug, chapter: chapterSlug } = await params;
  const ctx = await getChapterContext(bookSlug, chapterSlug);
  if (!ctx) notFound();

  const { book, chapter, prev, next, index } = ctx;
  const total = book.chapters.length;
  const chapterUrl = absoluteUrl(`/research/${bookSlug}/${chapterSlug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: chapter.title,
    position: index + 1,
    inLanguage: SITE_LANG,
    url: chapterUrl,
    isPartOf: {
      "@type": "Book",
      name: book.title,
      url: absoluteUrl(`/research/${bookSlug}`),
    },
    author: { "@type": "Person", name: AUTHOR.fullName, url: AUTHOR.url },
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <JsonLd data={jsonLd} />
      {chapter.headings.length > 0 && (
        <DynamicIslandTOC headings={chapter.headings} />
      )}

      <Link
        href={`/research/${bookSlug}`}
        className="mb-8 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <List className="h-3.5 w-3.5" strokeWidth={2} />
        {book.title} · 목차
      </Link>

      <header className="mb-10 border-b border-border/60 pb-8">
        <p className="mb-3 font-mono text-xs text-primary">
          chapter {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          {chapter.title}
        </h1>
        {/* 진행도 바 */}
        <div
          className="mt-6 h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`${total}개 챕터 중 ${index + 1}번째`}
        >
          <span
            className="block h-full rounded-full bg-primary transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <PostContent html={chapter.content} />

      {/* 페이지 넘기기 네비게이션 */}
      <nav className="mt-14 grid grid-cols-1 gap-3 border-t border-border/60 pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/research/${bookSlug}/${prev.slug}`}
            className="group flex flex-col rounded-xl border border-border/60 bg-card/30 p-4 transition-colors hover:border-primary/50 hover:bg-card/70"
          >
            <span className="mb-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <ArrowLeft className="h-3 w-3" strokeWidth={2} />
              이전 챕터
            </span>
            <span className="truncate text-sm text-foreground transition-colors group-hover:text-primary">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}

        {next ? (
          <Link
            href={`/research/${bookSlug}/${next.slug}`}
            className="group flex flex-col rounded-xl border border-border/60 bg-card/30 p-4 text-right transition-colors hover:border-primary/50 hover:bg-card/70"
          >
            <span className="mb-1 inline-flex items-center justify-end gap-1.5 font-mono text-[11px] text-muted-foreground">
              다음 챕터
              <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </span>
            <span className="truncate text-sm text-foreground transition-colors group-hover:text-primary">
              {next.title}
            </span>
          </Link>
        ) : (
          <Link
            href={`/research/${bookSlug}`}
            className="group flex flex-col rounded-xl border border-primary/40 bg-primary/5 p-4 text-right transition-colors hover:bg-primary/10"
          >
            <span className="mb-1 font-mono text-[11px] text-muted-foreground">
              마지막 챕터입니다
            </span>
            <span className="text-sm text-primary">목차로 돌아가기 →</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
