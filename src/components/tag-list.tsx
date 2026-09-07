"use client";

import { useState } from "react";
import Link from "next/link";

interface TagListProps {
  tags: { tag: string; count: number }[];
  /** 접힌 상태에서 보여줄 개수. 글이 늘어도 헤더 높이가 고정되도록 잘라 둔다. */
  visibleCount?: number;
}

/**
 * 글이 쌓일수록 count 1짜리 태그가 계속 늘어나 헤더를 잠식하기 때문에,
 * 기본은 상위 N개만 보여주고 나머지는 펼쳐서 본다.
 * (숨은 태그도 command palette 검색으로는 그대로 찾을 수 있다)
 */
export function TagList({ tags, visibleCount = 10 }: TagListProps) {
  const [expanded, setExpanded] = useState(false);

  if (tags.length === 0) return null;

  const hiddenCount = tags.length - visibleCount;
  const collapsible = hiddenCount > 0;
  const shown = collapsible && !expanded ? tags.slice(0, visibleCount) : tags;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5 font-mono text-xs">
      <span className="text-muted-foreground/70">tags:</span>
      {shown.map(({ tag, count }) => (
        <Link
          key={tag}
          href={`/posts/tag/${encodeURIComponent(tag)}`}
          className="group rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          #{tag}
          <span className="ml-1 text-muted-foreground/60 group-hover:text-primary/70">
            {count}
          </span>
        </Link>
      ))}
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="rounded-full border border-dashed border-border px-2 py-0.5 text-muted-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
        >
          {expanded ? "접기" : `+${hiddenCount}개 더`}
        </button>
      )}
    </div>
  );
}
