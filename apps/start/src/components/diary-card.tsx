import type { DiaryEntry } from "@/types/content";
import { formatDate } from "@/lib/format";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Link } from "@/components/link";
import { MdxContent } from "@/components/mdx-content";

interface DiaryCardProps {
  entry: DiaryEntry;
  compact?: boolean;
  /** 단일 글 페이지처럼 자기 자신을 가리키는 곳에서는 퍼머링크 아이콘을 숨긴다. */
  hidePermalink?: boolean;
}

export function DiaryCard({ entry, compact = false, hidePermalink = false }: DiaryCardProps) {
  return (
    <article
      className={
        compact
          ? "rounded-lg border border-border/60 bg-card/30 p-4"
          : "rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6"
      }
    >
      <header className="mb-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        {hidePermalink ? (
          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
        ) : (
          // 날짜가 글 자체로 가는 링크다. 목록에서 개별 글로 들어가는 유일한 경로라 프리렌더 크롤도 이걸 따라간다.
          <Link href={`/diary/${entry.slug}`} className="transition-colors hover:text-primary">
            <time dateTime={entry.date}>{formatDate(entry.date)}</time>
          </Link>
        )}
        {entry.mood && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-primary/80">{entry.mood}</span>
          </>
        )}
        {!hidePermalink && <CopyLinkButton path={`/diary/${entry.slug}`} className="ml-auto" />}
      </header>
      <div className="diary-content">
        <MdxContent code={entry.body} />
      </div>
    </article>
  );
}
