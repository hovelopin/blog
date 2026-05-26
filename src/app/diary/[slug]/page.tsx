import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DiaryCard } from "@/components/diary-card";
import { JsonLd } from "@/components/json-ld";
import { getAllDiarySlugs, getDiaryEntryBySlug } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { AUTHOR, SITE_LANG, absoluteUrl } from "@/lib/site";

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
  const title = `diary · ${label}`;
  const description = entry.mood ? `[${entry.mood}] ${label}` : label;
  const url = `/diary/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: entry.date,
    },
  };
}

export default async function DiaryEntryPage({ params }: DiaryEntryPageProps) {
  const { slug } = await params;
  const entry = await getDiaryEntryBySlug(slug);
  if (!entry) notFound();

  const entryUrl = absoluteUrl(`/diary/${slug}`);
  const label = formatDate(entry.date);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: entry.mood ? `diary · ${label} (${entry.mood})` : `diary · ${label}`,
      datePublished: entry.date,
      dateModified: entry.date,
      inLanguage: SITE_LANG,
      author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      publisher: { "@type": "Person", name: AUTHOR.fullName, url: AUTHOR.url },
      url: entryUrl,
      mainEntityOfPage: entryUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "Diary",
          item: absoluteUrl("/diary"),
        },
        { "@type": "ListItem", position: 3, name: label, item: entryUrl },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16">
      <JsonLd data={jsonLd} />
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
