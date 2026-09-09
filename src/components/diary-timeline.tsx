"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { DiaryFrontmatter } from "@/types/content";
import { formatMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * 타임라인이 필터·그룹에 쓰는 메타와, 서버에서 미리 렌더한 카드.
 * 본문(MDX)은 서버 컴포넌트로만 렌더할 수 있어서 card 로 받아 그대로 꽂는다.
 */
export interface DiaryTimelineItem extends DiaryFrontmatter {
  slug: string;
  card: ReactNode;
}

interface DiaryTimelineProps {
  items: DiaryTimelineItem[];
}

function groupByMonth(items: DiaryTimelineItem[]): Array<[string, DiaryTimelineItem[]]> {
  const groups = new Map<string, DiaryTimelineItem[]>();
  for (const item of items) {
    const key = item.date.slice(0, 7);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return Array.from(groups.entries());
}

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
        active
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border/60 bg-card/30 text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      #{label}
    </button>
  );
}

export function DiaryTimeline({ items }: DiaryTimelineProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const moods = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) if (item.mood) set.add(item.mood);
    return Array.from(set);
  }, [items]);

  const groups = useMemo(() => {
    const filtered = selectedMood ? items.filter((i) => i.mood === selectedMood) : items;
    return groupByMonth(filtered);
  }, [items, selectedMood]);

  return (
    <div>
      {moods.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip
            label="all"
            active={selectedMood === null}
            onClick={() => setSelectedMood(null)}
          />
          {moods.map((m) => (
            <FilterChip
              key={m}
              label={m}
              active={selectedMood === m}
              onClick={() => setSelectedMood(m)}
            />
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">선택한 필터의 결과가 없습니다.</p>
      ) : (
        groups.map(([ym, group]) => (
          <section key={ym} className="mb-10 last:mb-0">
            <h2 className="sticky top-0 z-10 -mx-5 mb-4 bg-background/85 px-5 py-2 font-mono text-xs text-muted-foreground backdrop-blur sm:-mx-6 sm:px-6">
              <span className="text-foreground">{formatMonth(ym)}</span>
              <span className="ml-2 text-primary/70">({group.length})</span>
            </h2>
            <ol className="relative pl-6">
              {/* 타임라인 선. 첫 점 위로 꼬리가 남지 않게 점 중심(= 카드 상단)에서 시작한다. */}
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-primary/40" />
              {group.map((item) => (
                <li key={item.slug} className="relative mb-5 last:mb-0">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[27px] -top-1 h-2 w-2 rounded-full bg-primary/70"
                  />
                  {item.card}
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </div>
  );
}
