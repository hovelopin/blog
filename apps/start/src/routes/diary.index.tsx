import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/link";
import { DiaryCard } from "@/components/diary-card";
import { DiaryTimeline } from "@/components/diary-timeline";
import { pageHead } from "@/lib/head";
import { getDiaryEntries } from "@/lib/server-fns";

export const Route = createFileRoute("/diary/")({
  loader: () => getDiaryEntries(),
  head: () =>
    pageHead({
      title: "Diary",
      description: "짧은 메모들. 생각, 발견, 삽질의 기록.",
      path: "/diary",
    }),
  component: DiaryPage,
});

function DiaryPage() {
  const entries = Route.useLoaderData();
  const items = entries.map((entry) => ({
    slug: entry.slug,
    date: entry.date,
    mood: entry.mood,
    card: <DiaryCard entry={entry} />,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← back to index
      </Link>

      <header className="mb-10">
        <p className="mb-3 font-mono text-xs text-primary">~/hovelopin/diary $ ls -la</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          diary
        </h1>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 비어 있습니다. <code>content/diary</code>에 파일을 추가하세요.
        </p>
      ) : (
        <DiaryTimeline items={items} />
      )}
    </div>
  );
}
