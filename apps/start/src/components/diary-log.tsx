import { Link } from "@/components/link";
import type { DiaryEntry } from "@/types/content";

interface DiaryLogProps {
  entries: DiaryEntry[];
}

/** "2026-09-30" → "26.09.30". 날짜 열 폭을 고정하려고 짧게 쓴다. */
function shortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return y && m && d ? `${y.slice(2)}.${m}.${d}` : isoDate;
}

/**
 * 홈의 다이어리 섹션. 날짜와 본문 첫머리 한 줄을 놓고 행 아래를 선으로 나눈다.
 * kciter.so 의 Thoughts 목록(날짜 모노 11.5px, 본문 13.6px)을 기준으로 맞췄다.
 */
export function DiaryLog({ entries }: DiaryLogProps) {
  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <li key={entry.slug} className="border-b border-border/70">
          <Link href={`/diary/${entry.slug}`} className="group flex items-baseline gap-2.5 py-2">
            <time
              dateTime={entry.date}
              className="shrink-0 font-mono text-[11.5px] leading-7 text-muted-foreground/80"
            >
              {shortDate(entry.date)}
            </time>
            {entry.mood && (
              <span className="shrink-0 text-[12px] text-primary/70">[{entry.mood}]</span>
            )}
            <span className="min-w-0 truncate text-[13.6px] leading-[1.4] text-foreground/85 transition-colors group-hover:text-primary">
              {entry.excerpt}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
