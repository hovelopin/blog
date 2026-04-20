import Link from "next/link";
import type { Metadata } from "next";
import { DiaryTimeline } from "@/components/diary-timeline";
import { getAllDiaryEntries } from "@/lib/content";

export const metadata: Metadata = {
  title: "Diary",
  description: "짧은 메모들. 생각, 발견, 삽질의 기록.",
};

export default async function DiaryPage() {
  const entries = await getAllDiaryEntries();

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← back to index
      </Link>

      <header className="mb-10">
        <p className="mb-3 font-mono text-xs text-primary">
          ~/hovelopin/diary $ ls -la
        </p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          diary
        </h1>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 비어 있습니다. <code>content/diary</code>에 파일을 추가하세요.
        </p>
      ) : (
        <DiaryTimeline entries={entries} />
      )}
    </div>
  );
}
