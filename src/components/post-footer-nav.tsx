import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PostSummary } from "@/types/content";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PostFooterNavProps {
  prev: PostSummary | null;
  next: PostSummary | null;
  related: PostSummary[];
}

function AdjacentCard({
  post,
  direction,
}: {
  post: PostSummary;
  direction: "prev" | "next";
}) {
  const isPrev = direction === "prev";
  return (
    <Link
      href={`/posts/${post.slug}`}
      className={cn(
        "group flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/40 p-4 transition-colors hover:border-primary/50 hover:bg-muted/40",
        isPrev ? "items-start text-left" : "items-end text-right",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground",
          isPrev ? "" : "flex-row-reverse",
        )}
      >
        {isPrev ? (
          <ArrowLeft size={12} aria-hidden="true" />
        ) : (
          <ArrowRight size={12} aria-hidden="true" />
        )}
        {isPrev ? "previous" : "next"}
      </span>
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground">
        {formatDate(post.date)}
      </span>
    </Link>
  );
}

export function PostFooterNav({ prev, next, related }: PostFooterNavProps) {
  return (
    <div className="mt-16 border-t border-border/60 pt-10">
      {related.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            # related
          </h2>
          <ul className="flex flex-col divide-y divide-border/60">
            {related.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/posts/${p.slug}`}
                  className="group flex flex-col gap-1 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {p.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {formatDate(p.date)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(prev || next) && (
        <section>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            # nav
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {prev ? (
              <AdjacentCard post={prev} direction="prev" />
            ) : (
              <div aria-hidden="true" />
            )}
            {next ? (
              <AdjacentCard post={next} direction="next" />
            ) : (
              <div aria-hidden="true" />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
