import type { DiaryEntry } from "@/types/content";
import { formatDate, formatRelativeDate } from "@/lib/format";

interface DiaryCardProps {
  entry: DiaryEntry;
  compact?: boolean;
}

export function DiaryCard({ entry, compact = false }: DiaryCardProps) {
  return (
    <article
      className={
        compact
          ? "rounded-lg border border-border/60 bg-card/30 p-4"
          : "rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6"
      }
    >
      <header className="mb-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <time dateTime={entry.date} title={formatDate(entry.date)}>
          {formatRelativeDate(entry.date)}
        </time>
        {entry.mood && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-primary/80">{entry.mood}</span>
          </>
        )}
      </header>
      <div
        className="diary-content"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />
    </article>
  );
}
