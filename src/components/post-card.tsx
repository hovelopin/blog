import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PostSummary } from "@/types/content";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Variant = "feature" | "default";

interface PostCardProps {
  post: PostSummary;
  variant?: Variant;
  className?: string;
}

function Meta({ post }: { post: PostSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingTimeMinutes} min read</span>
      {post.tags && post.tags.length > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="text-primary/80">
                #{tag}
              </span>
            ))}
          </span>
        </>
      )}
    </div>
  );
}

export function PostCard({
  post,
  variant = "default",
  className,
}: PostCardProps) {
  const feature = variant === "feature";

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={cn(
        "group relative block w-full rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:border-primary/50 hover:bg-card/70 sm:p-5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground opacity-0 transition-all duration-300 group-hover:border-primary/50 group-hover:text-primary group-hover:opacity-100"
      >
        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </span>

      <Meta post={post} />
      <h2
        className={cn(
          "mb-1.5 mt-2.5 pr-8 font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary",
          feature ? "text-base sm:text-lg" : "text-sm sm:text-base",
        )}
      >
        {post.title}
      </h2>
      <p
        className={cn(
          "leading-relaxed text-muted-foreground",
          feature
            ? "text-[13px] sm:text-sm"
            : "line-clamp-3 text-xs sm:text-[13px]",
        )}
      >
        {post.description}
      </p>
    </Link>
  );
}
