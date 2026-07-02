import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import type { BookSummary } from "@/types/content";

interface BookshelfProps {
  books: BookSummary[];
}

export function Bookshelf({ books }: BookshelfProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-12">
      {books.map((book) => (
        <Link
          key={book.slug}
          href={`/research/${book.slug}`}
          className="group flex flex-col focus:outline-none"
          aria-label={`${book.title} — ${book.description}`}
        >
          <div className="transition-transform duration-500 group-hover:-translate-y-2 group-focus-visible:-translate-y-2">
            <BookCover book={book} />
          </div>

          {/* 책이 놓인 선반 라인 */}
          <span
            aria-hidden="true"
            className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"
          />

          <div className="mt-3 px-0.5">
            <p className="truncate text-[13px] font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
              {book.title}
            </p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              {book.repo ?? book.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
