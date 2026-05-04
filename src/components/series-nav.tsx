import Link from "next/link";
import { Layers } from "lucide-react";
import type { SeriesContext } from "@/types/content";
import { cn } from "@/lib/utils";

interface SeriesNavProps {
  context: SeriesContext;
}

export function SeriesNav({ context }: SeriesNavProps) {
  const { series, posts, currentIndex } = context;
  return (
    <aside
      aria-label={`${series} 시리즈 목차`}
      className="mb-10 rounded-xl border border-border/70 bg-muted/30 p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Layers size={12} aria-hidden="true" />
          series
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>
      <p className="mb-3 text-sm font-semibold text-foreground">{series}</p>
      <ol className="flex flex-col gap-1.5">
        {posts.map((p, i) => {
          const isCurrent = i === currentIndex;
          return (
            <li key={p.slug} className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "shrink-0 font-mono text-[11px] tabular-nums",
                  isCurrent ? "text-primary" : "text-muted-foreground",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {isCurrent ? (
                <span className="text-sm font-medium text-primary">
                  {p.title}
                </span>
              ) : (
                <Link
                  href={`/posts/${p.slug}`}
                  className="text-sm text-foreground transition-colors hover:text-primary"
                >
                  {p.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
