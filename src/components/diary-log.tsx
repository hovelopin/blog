import Link from "next/link";
import type { DiaryEntry } from "@/types/content";
import { formatDate, formatRelativeDate } from "@/lib/format";

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

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (full, name) => NAMED_ENTITIES[name] ?? full);
}

function toPreview(html: string, max = 80): string {
  const text = decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export function DiaryLog({ entries }: DiaryLogProps) {
  return (
    <ul className="font-mono text-[13px] leading-[1.9]">
      {entries.map((entry) => {
        const hash = shortHash(entry.slug);
        const preview = toPreview(entry.content);
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
              <span className="text-primary/80 group-hover:text-primary">
                {hash}
              </span>
              <time
                dateTime={entry.date}
                title={formatDate(entry.date)}
                className="w-[4.5rem] shrink-0 text-muted-foreground"
              >
                {formatRelativeDate(entry.date)}
              </time>
              <span className="truncate text-foreground/85">
                {entry.mood && (
                  <span className="mr-2 text-primary/70">[{entry.mood}]</span>
                )}
                {preview}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
