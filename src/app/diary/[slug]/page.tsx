import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DiaryCard } from "@/components/diary-card";
import { getAllDiarySlugs, getDiaryEntryBySlug } from "@/lib/content";
import { formatDate } from "@/lib/format";

interface DiaryEntryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllDiarySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DiaryEntryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getDiaryEntryBySlug(slug);
  if (!entry) return {};
  const label = formatDate(entry.date);
  return {
    title: `diary · ${label}`,
    description: entry.mood ? `[${entry.mood}] ${label}` : label,
  };
}

export default async function DiaryEntryPage({ params }: DiaryEntryPageProps) {
  const { slug } = await params;
  const entry = await getDiaryEntryBySlug(slug);
  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/diary"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← back to diary
      </Link>

      <header className="mb-6">
        <p className="font-mono text-xs text-primary">
          ~/hovelopin/diary $ cat {slug}.md
        </p>
      </header>

      <DiaryCard entry={entry} hidePermalink />
    </div>
  );
}
