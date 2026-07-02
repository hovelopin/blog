import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { PostContent } from "@/components/post-content";
import { JsonLd } from "@/components/json-ld";
import { getAllBookSlugs, getBookBySlug } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { AUTHOR, SITE_LANG, absoluteUrl } from "@/lib/site";

interface BookPageProps {
  params: Promise<{ book: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllBookSlugs();
  return slugs.map((book) => ({ book }));
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { book: slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return {};
  const url = `/research/${slug}`;
  return {
    title: book.title,
    description: book.description,
    alternates: { canonical: url },
    openGraph: {
      type: "book",
      url,
      title: book.title,
      description: book.description,
      tags: book.tags,
    },
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { book: slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const firstChapter = book.chapters[0];
  const bookUrl = absoluteUrl(`/research/${slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    description: book.description,
    inLanguage: SITE_LANG,
    url: bookUrl,
    author: { "@type": "Person", name: AUTHOR.fullName, url: AUTHOR.url },
    numberOfPages: book.chapters.length,
    ...(book.tags && book.tags.length > 0
      ? { keywords: book.tags.join(", ") }
      : {}),
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <JsonLd data={jsonLd} />
      <Link
        href="/research"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← cd ~/research
      </Link>

      <p className="mb-6 font-mono text-xs text-primary">
        ~/hovelopin/research/{slug} $ cat book.md
      </p>

      {/* 표지 + 메타 */}
      <header className="mb-10 flex flex-col gap-6 border-b border-border/60 pb-10 sm:flex-row sm:items-start sm:gap-8">
        <div className="mx-auto w-[160px] shrink-0 sm:mx-0 sm:w-[185px]">
          <BookCover book={book} size="hero" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            {book.title}
          </h1>
          {book.repo && (
            <a
              href={`https://github.com/${book.repo}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1.5 inline-block font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              {book.repo} ↗
            </a>
          )}
          <p className="mt-4 break-keep text-[15px] leading-relaxed text-muted-foreground">
            {book.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
            <span>{book.chapters.length} chapters</span>
            <span aria-hidden="true">·</span>
            <time dateTime={book.date}>업데이트 {formatDate(book.date)}</time>
            {book.sourceUrl && (
              <>
                <span aria-hidden="true">·</span>
                <a
                  href={book.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary/80 transition-colors hover:text-primary"
                >
                  공식 문서 ↗
                </a>
              </>
            )}
          </div>
          {book.tags && book.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs">
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {firstChapter && (
            <Link
              href={`/research/${slug}/${firstChapter.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 font-mono text-xs text-primary transition-colors hover:bg-primary/20"
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
              첫 챕터부터 읽기
            </Link>
          )}
        </div>
      </header>

      {/* 서문 */}
      {book.intro && (
        <section className="mb-12">
          <PostContent html={book.intro} />
        </section>
      )}

      {/* 목차 */}
      <section>
        <h2 className="mb-5 font-mono text-sm text-muted-foreground">
          # 목차 (table of contents)
        </h2>
        {book.chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 챕터가 없습니다. <code>content/research/{slug}/</code>에{" "}
            <code>NN-제목.md</code> 파일을 추가하세요.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60">
            {book.chapters.map((chapter, i) => (
              <li key={chapter.slug}>
                <Link
                  href={`/research/${slug}/${chapter.slug}`}
                  className="group flex items-center gap-4 bg-card/30 px-4 py-3.5 transition-colors hover:bg-card/70 sm:px-5"
                >
                  <span className="font-mono text-xs tabular-nums text-muted-foreground/60 group-hover:text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors group-hover:text-primary">
                    {chapter.title}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
