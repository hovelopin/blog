import Image from "next/image";
import Link from "next/link";
import type { PostSummary } from "@/types/content";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * feature — /posts 최상단 큰 카드 (썸네일 위, 본문 아래)
 * default — /posts 목록 가로 카드 (모바일에서 세로로 접힘)
 * bento   — 홈 recent posts 왼쪽 큰 카드 (오른쪽 두 장과 높이를 맞춤)
 * compact — 홈 recent posts 오른쪽 작은 카드 (제목 + 날짜·읽는 시간)
 */
type Variant = "feature" | "default" | "bento" | "compact";

interface PostCardProps {
  post: PostSummary;
  variant?: Variant;
  className?: string;
}

const CARD_BASE =
  "group block overflow-hidden rounded-xl border border-border/60 bg-card/40 no-underline transition-colors hover:border-primary/50 hover:bg-card/70";

const TITLE_HOVER = "tracking-tight text-foreground transition-colors group-hover:text-primary";

/**
 * 썸네일 자리.
 * cover 가 없는 글은 빈 칸 대신 mono 태그를 얹은 무채색 타일로 채운다.
 * (레이아웃이 글마다 들쭉날쭉해지지 않게 비율은 항상 고정)
 */
function Thumbnail({
  post,
  sizes,
  priority = false,
}: {
  post: PostSummary;
  sizes: string;
  priority?: boolean;
}) {
  if (!post.cover) {
    return (
      <div
        aria-hidden="true"
        className="flex h-full w-full items-center justify-center bg-muted/60 [background-image:repeating-linear-gradient(135deg,transparent_0px,transparent_9px,color-mix(in_oklch,var(--color-border)_60%,transparent)_9px,color-mix(in_oklch,var(--color-border)_60%,transparent)_10px)]"
      >
        <span className="rounded bg-background/70 px-2 py-1 font-mono text-[11px] text-muted-foreground/80">
          #{post.tags?.[0] ?? "post"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={post.cover}
      alt={post.coverAlt ?? post.title}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  );
}

function Meta({ post }: { post: PostSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted-foreground/80">
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingTimeMinutes} min read</span>
    </div>
  );
}

function LatestBadge() {
  return (
    // flex 컨테이너 안에서는 inline-block 이 cross axis 로 늘어나므로 self-start 로 고정한다.
    <span className="mb-2.5 inline-block w-fit self-start rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
      latest
    </span>
  );
}

export function PostCard({ post, variant = "default", className }: PostCardProps) {
  const href = `/posts/${post.slug}`;

  // /posts 최상단: 썸네일을 위로 크게 깔고 요약을 3줄까지 보여준다.
  if (variant === "feature") {
    return (
      <Link href={href} className={cn(CARD_BASE, className)}>
        <div className="relative aspect-16/9 w-full overflow-hidden bg-muted/40">
          <Thumbnail
            post={post}
            sizes="(max-width: 768px) 100vw, 768px"
            // 목록의 LCP 요소라 lazy 로 미루지 않는다.
            priority
          />
        </div>
        <div className="px-5 pb-5 pt-4 sm:px-6">
          <LatestBadge />
          <h2 className={cn("mb-2 text-lg font-bold leading-snug sm:text-xl", TITLE_HOVER)}>
            {post.title}
          </h2>
          <p className="mb-2.5 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            {post.description}
          </p>
          <Meta post={post} />
        </div>
      </Link>
    );
  }

  // 홈 왼쪽 큰 카드: 오른쪽 작은 카드 두 장과 높이가 맞도록 본문이 늘어난다.
  if (variant === "bento") {
    return (
      <Link href={href} className={cn(CARD_BASE, "flex h-full flex-col", className)}>
        <div className="relative aspect-16/9 w-full overflow-hidden bg-muted/40">
          <Thumbnail post={post} sizes="(max-width: 768px) 100vw, 460px" priority />
        </div>
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
          <LatestBadge />
          <h2
            className={cn(
              "mb-2 line-clamp-2 text-base font-bold leading-snug sm:text-lg",
              TITLE_HOVER,
            )}
          >
            {post.title}
          </h2>
          <p className="mb-3 line-clamp-5 text-[13px] leading-relaxed text-muted-foreground">
            {post.description}
          </p>
          {/* 카드 높이는 오른쪽 두 장이 정하므로, 남는 여백은 요약 아래로 몰아 날짜를 밑단에 붙인다. */}
          <div className="mt-auto">
            <Meta post={post} />
          </div>
        </div>
      </Link>
    );
  }

  // 홈 오른쪽 작은 카드: 제목과 날짜·읽는 시간만 둔다.
  if (variant === "compact") {
    return (
      <Link href={href} className={cn(CARD_BASE, "flex h-full flex-col", className)}>
        <div className="relative aspect-16/9 w-full overflow-hidden bg-muted/40">
          <Thumbnail post={post} sizes="(max-width: 768px) 50vw, 300px" />
        </div>
        <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
          <h3 className={cn("mb-1.5 line-clamp-2 text-sm font-semibold leading-snug", TITLE_HOVER)}>
            {post.title}
          </h3>
          <p className="mb-2.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {post.description}
          </p>
          {/* 카드 높이가 제목 줄 수에 따라 달라지므로 메타 정보는 밑단에 붙여 둔다. */}
          <div className="mt-auto">
            <Meta post={post} />
          </div>
        </div>
      </Link>
    );
  }

  // /posts 목록: 데스크톱에서는 가로 카드, 모바일에서는 세로로 접힌다.
  return (
    <Link href={href} className={cn(CARD_BASE, "flex flex-col sm:flex-row", className)}>
      <div className="relative aspect-16/9 w-full shrink-0 overflow-hidden bg-muted/40 sm:aspect-16/10 sm:w-[200px]">
        <Thumbnail post={post} sizes="(max-width: 640px) 100vw, 200px" />
      </div>
      <div className="flex min-w-0 flex-col justify-center px-5 py-4">
        <h2
          className={cn(
            "mb-1.5 line-clamp-2 text-[15px] font-semibold leading-snug sm:text-base",
            TITLE_HOVER,
          )}
        >
          {post.title}
        </h2>
        <p className="mb-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {post.description}
        </p>
        <Meta post={post} />
      </div>
    </Link>
  );
}
