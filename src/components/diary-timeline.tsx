"use client";

import { useMemo, useState } from "react";
import type { DiaryEntry } from "@/types/content";
import { DiaryCard } from "@/components/diary-card";
import { cn } from "@/lib/utils";

interface DiaryTimelineProps {
  entries: DiaryEntry[];
}

function groupByMonth(entries: DiaryEntry[]): Array<[string, DiaryEntry[]]> {
  const groups = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }
  return Array.from(groups.entries());
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}.${m}`;
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

export function DiaryTimeline({ entries }: DiaryTimelineProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const moods = useMemo(() => {
    const set = new Set<string>();
    for (const entry of entries) if (entry.mood) set.add(entry.mood);
    return Array.from(set);
  }, [entries]);

  const groups = useMemo(() => {
    const filtered = selectedMood
      ? entries.filter((e) => e.mood === selectedMood)
      : entries;
    return groupByMonth(filtered);
  }, [entries, selectedMood]);

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
        <p className="text-sm text-muted-foreground">
          선택한 필터의 결과가 없습니다.
        </p>
      ) : (
        groups.map(([ym, items]) => (
          <section key={ym} className="mb-10 last:mb-0">
            <h2 className="sticky top-0 z-10 -mx-5 mb-4 border-b border-border/50 bg-background/85 px-5 py-2 font-mono text-xs text-muted-foreground backdrop-blur sm:-mx-6 sm:px-6">
              <span className="text-foreground">{formatMonthLabel(ym)}</span>
              <span className="ml-2 text-primary/70">({items.length})</span>
            </h2>
            <ol className="relative border-l border-border/60 pl-6">
              {items.map((entry) => (
                <li key={entry.slug} className="relative mb-5 last:mb-0">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[27px] top-5 h-2 w-2 rounded-full bg-primary/70 ring-4 ring-background"
                  />
                  <DiaryCard entry={entry} />
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </div>
  );
}
