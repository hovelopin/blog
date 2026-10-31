import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";

interface Entry {
  url: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
}

function toXml(entries: Entry[]): string {
  const body = entries
    .map(
      (e) => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const c = await import("@/lib/content");
        const posts = c.getAllPostSummaries();
        const diary = c.getAllDiaryEntries();
        const tags = c.getAllTags();
        const books = c.getAllBooks();
        const now = new Date();

        const entries: Entry[] = [
          { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
          {
            url: `${SITE_URL}/articles`,
            lastModified: posts[0] ? new Date(posts[0].date) : now,
            changeFrequency: "weekly",
            priority: 0.8,
          },
          {
            url: `${SITE_URL}/research`,
            lastModified: books[0] ? new Date(books[0].date) : now,
            changeFrequency: "weekly",
            priority: 0.6,
          },
          {
            url: `${SITE_URL}/diary`,
            lastModified: diary[0] ? new Date(diary[0].date) : now,
            changeFrequency: "weekly",
            priority: 0.5,
          },
          ...posts.map(
            (p): Entry => ({
              url: `${SITE_URL}/articles/${p.slug}`,
              lastModified: new Date(p.date),
              changeFrequency: "monthly",
              priority: 0.7,
            }),
          ),
          ...diary.map(
            (d): Entry => ({
              url: `${SITE_URL}/diary/${d.slug}`,
              lastModified: new Date(d.date),
              changeFrequency: "monthly",
              priority: 0.4,
            }),
          ),
          ...tags.map(
            (t): Entry => ({
              url: `${SITE_URL}/articles/tag/${encodeURIComponent(t.tag)}`,
              lastModified: now,
              changeFrequency: "weekly",
              priority: 0.3,
            }),
          ),
          ...books.map(
            (b): Entry => ({
              url: `${SITE_URL}/research/${b.slug}`,
              lastModified: new Date(b.date),
              changeFrequency: "monthly",
              priority: 0.5,
            }),
          ),
          ...books.flatMap((b) =>
            b.chapters.map(
              (ch): Entry => ({
                url: `${SITE_URL}/research/${b.slug}/${ch.slug}`,
                lastModified: new Date(b.date),
                changeFrequency: "monthly",
                priority: 0.4,
              }),
            ),
          ),
        ];

        return new Response(toXml(entries), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
