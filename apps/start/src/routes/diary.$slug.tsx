import { createFileRoute, notFound } from "@tanstack/react-router";
import { Link } from "@/components/link";
import { DiaryCard } from "@/components/diary-card";
import { JsonLd } from "@/components/json-ld";
import { formatDate } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { getDiaryEntry } from "@/lib/server-fns";
import { AUTHOR, SITE_LANG, absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/diary/$slug")({
  loader: async ({ params }) => {
    const entry = await getDiaryEntry({ data: params.slug });
    if (!entry) throw notFound();
    return entry;
  },
  head: ({ loaderData: entry }) => {
    if (!entry) return {};
    const label = formatDate(entry.date);
    return pageHead({
      title: `diary · ${label}`,
      description: entry.mood ? `[${entry.mood}] ${label}` : label,
      path: `/diary/${entry.slug}`,
      type: "article",
      article: { publishedTime: entry.date, author: AUTHOR.name },
    });
  },
  component: DiaryEntryPage,
});

function DiaryEntryPage() {
  const entry = Route.useLoaderData();
  const entryUrl = absoluteUrl(`/diary/${entry.slug}`);
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
        { "@type": "ListItem", position: 2, name: "Diary", item: absoluteUrl("/diary") },
        { "@type": "ListItem", position: 3, name: label, item: entryUrl },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <JsonLd data={jsonLd} />
      <Link
        href="/diary"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← back to diary
      </Link>

      <header className="mb-6">
        <p className="font-mono text-xs text-primary">~/hovelopin/diary $ cat {entry.slug}.md</p>
      </header>

      <DiaryCard entry={entry} hidePermalink />
    </div>
  );
}
