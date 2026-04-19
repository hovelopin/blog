import Link from "next/link";
import type { PostSummary } from "@/types/content";
import { formatDate } from "@/lib/format";
import { PostCover } from "@/components/post-cover";
import { cn } from "@/lib/utils";

type Variant = "feature" | "image-left" | "image-right" | "text-only";

interface PostCardProps {
  post: PostSummary;
  variant?: Variant;
  className?: string;
}

function Meta({ post }: { post: PostSummary }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
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
  variant = "image-left",
  className,
}: PostCardProps) {
  const coverLabel = post.tags?.[0];

  if (variant === "feature") {
    return (
      <Link
        href={`/posts/${post.slug}`}
        className={cn(
          "group block rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:border-primary/50 hover:bg-card/70 sm:p-5",
          className,
        )}
      >
        <PostCover
          src={post.cover}
          alt={post.coverAlt ?? post.title}
          seed={post.slug}
          label={coverLabel}
          className="mb-4 aspect-[16/8] w-full"
          sizes="(max-width: 640px) 100vw, 720px"
        />
        <Meta post={post} />
        <h2 className="mb-2 text-xl font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
          {post.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {post.description}
        </p>
      </Link>
    );
  }

  if (variant === "text-only") {
    return (
      <Link
        href={`/posts/${post.slug}`}
        className={cn(
          "group block rounded-xl border border-border/60 bg-card/40 p-5 transition-all hover:border-primary/50 hover:bg-card/70 sm:p-6",
          className,
        )}
      >
        <Meta post={post} />
        <h2 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
          {post.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {post.description}
        </p>
      </Link>
    );
  }

  const imageLeft = variant === "image-left";

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={cn(
        "group block rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:border-primary/50 hover:bg-card/70 sm:p-5",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:gap-5",
          imageLeft ? "sm:flex-row" : "sm:flex-row-reverse",
        )}
      >
        <PostCover
          src={post.cover}
          alt={post.coverAlt ?? post.title}
          seed={post.slug}
          label={coverLabel}
          className={cn(
            "w-full flex-shrink-0",
            imageLeft
              ? "aspect-[16/10] sm:aspect-[4/3] sm:w-[40%]"
              : "aspect-[16/10] sm:aspect-[3/2] sm:w-[34%]",
          )}
          sizes="(max-width: 640px) 100vw, 280px"
        />
        <div className="min-w-0 flex-1">
          <Meta post={post} />
          <h2 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
            {post.title}
          </h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {post.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
