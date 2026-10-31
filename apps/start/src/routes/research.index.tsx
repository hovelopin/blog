import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/link";
import { Bookshelf } from "@/components/bookshelf";
import { pageHead } from "@/lib/head";
import { getBooks } from "@/lib/server-fns";

export const Route = createFileRoute("/research/")({
  loader: () => getBooks(),
  head: () =>
    pageHead({
      title: "Research",
      description: "책을 읽거나 오픈소스를 탐구하며 정리한 노트.",
      path: "/research",
    }),
  component: ResearchPage,
});

function ResearchPage() {
  const books = Route.useLoaderData();
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← cd ~
      </Link>

      <header className="mb-12">
        <p className="mb-3 font-mono text-xs text-primary">~/hovelopin/research $ ls ./bookshelf</p>
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          research
        </h1>
        <p className="max-w-2xl break-keep text-balance text-sm leading-relaxed text-muted-foreground">
          책을 읽거나 오픈소스를 탐구하며 정리한 노트입니다.
        </p>
      </header>

      {/* ◆ BOOKSHELF ◆ 장식 헤더 */}
      <div className="mb-10 flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          ◆ bookshelf ◆
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 탐구한 책이 없습니다. <code>content/research/&lt;slug&gt;/book.mdx</code>로 첫 책을
          꽂아보세요.
        </p>
      ) : (
        <Bookshelf books={books} />
      )}
    </div>
  );
}
