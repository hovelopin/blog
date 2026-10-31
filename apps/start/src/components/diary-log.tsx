import { Link } from "@/components/link";
import type { DiaryEntry } from "@/types/content";
import { formatDate } from "@/lib/format";

interface DiaryLogProps {
  entries: DiaryEntry[];
}

function shortHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

/** 홈의 다이어리 섹션. git log 처럼 한 줄에 해시·날짜·미리보기를 놓는다. */
export function DiaryLog({ entries }: DiaryLogProps) {
  return (
    <ul className="font-mono text-[13px] leading-[1.9]">
      {entries.map((entry) => {
        const hash = shortHash(entry.slug);
        return (
          <li key={entry.slug}>
            <Link
              href="/diary"
              className="group grid grid-cols-[auto_auto_auto_1fr] items-baseline gap-x-3 rounded px-2 py-0.5 transition-colors hover:bg-muted/40"
            >
              <span
                aria-hidden="true"
                className="text-muted-foreground/60 group-hover:text-primary"
              >
                *
              </span>
              <span className="text-primary/80 group-hover:text-primary">{hash}</span>
              <time
                dateTime={entry.date}
                // 행마다 grid 가 따로라 날짜 열은 고정 폭으로만 줄을 맞출 수 있다.
                // 가장 긴 "Jan 28, 2026"(13px mono 기준 94px)이 들어가도록 6.25rem.
                className="w-[6.25rem] shrink-0 whitespace-nowrap text-muted-foreground"
              >
                {formatDate(entry.date)}
              </time>
              <span className="truncate text-foreground/85">
                {entry.mood && <span className="mr-2 text-primary/70">[{entry.mood}]</span>}
                {entry.excerpt}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
