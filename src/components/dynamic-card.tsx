"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import type { PostSummary } from "@/types/content";
import { formatDate } from "@/lib/format";
import { PostCover } from "@/components/post-cover";
import { cn } from "@/lib/utils";

interface DynamicCardProps {
  post: PostSummary;
  className?: string;
}

const ROTATION_RANGE = 10;

export function DynamicCard({ post, className }: DynamicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [vars, setVars] = useState<CSSProperties>({});
  const [hover, setHover] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * 2 * ROTATION_RANGE;
    const rotX = -(y - 0.5) * 2 * ROTATION_RANGE;
    setVars({
      ["--rot-x" as string]: `${rotX}deg`,
      ["--rot-y" as string]: `${rotY}deg`,
      ["--mouse-x" as string]: `${x * 100}%`,
      ["--mouse-y" as string]: `${y * 100}%`,
    });
  };

  const handleLeave = () => {
    setHover(false);
    setVars({});
  };

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={cn(
        "group block [perspective:900px]",
        "w-full max-w-[320px]",
        className,
      )}
      onMouseMove={handleMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={handleLeave}
    >
      <div
        ref={cardRef}
        style={vars}
        className={cn(
          "relative flex h-[460px] w-full flex-col overflow-hidden rounded-2xl",
          "border border-border bg-card",
          "shadow-[0_6px_20px_-8px_rgba(0,0,0,0.12),0_2px_6px_-2px_rgba(0,0,0,0.06)]",
          "dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.04)]",
          "transition-[transform,box-shadow] duration-300 ease-out [transform-style:preserve-3d]",
          hover
            ? "[transform:rotateX(var(--rot-x))_rotateY(var(--rot-y))_scale(1.02)] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.18),0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.75),0_0_0_1px_color-mix(in_oklch,var(--primary)_45%,transparent)]"
            : "[transform:rotateX(0)_rotateY(0)_scale(1)]",
        )}
      >
        <PostCover
          src={post.cover}
          alt={post.coverAlt ?? post.title}
          seed={post.slug}
          label={post.tags?.[0]}
          className="aspect-[5/3] w-full flex-shrink-0 rounded-none border-0 border-b border-border/40"
          sizes="320px"
        />

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingTimeMinutes} min</span>
          </div>

          <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
            {post.title}
          </h3>

          <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-muted-foreground">
            {post.description}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300",
            hover ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.12), transparent 45%)",
            mixBlendMode: "screen",
          }}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300",
            hover ? "opacity-60" : "opacity-0",
          )}
          style={{
            background:
              "conic-gradient(from 140deg at var(--mouse-x, 50%) var(--mouse-y, 50%), oklch(0.82 0.14 155 / 0.22), oklch(0.75 0.18 320 / 0.18), oklch(0.82 0.16 85 / 0.2), oklch(0.7 0.2 250 / 0.18), oklch(0.82 0.14 155 / 0.22))",
            mixBlendMode: "overlay",
          }}
        />
      </div>
    </Link>
  );
}
