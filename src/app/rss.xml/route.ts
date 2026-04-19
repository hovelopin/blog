import { getAllPostSummaries } from "@/lib/content";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hovelopin.dev";
const SITE_TITLE = "hovelopin — dev log";
const SITE_DESCRIPTION =
  "개발하면서 배운 것, 만든 것, 삽질한 것을 기록하는 개인 개발 블로그.";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getAllPostSummaries();
  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/posts/${p.slug}`;
      const pubDate = new Date(p.date).toUTCString();
      const categories = (p.tags ?? [])
        .map((t) => `    <category>${escape(t)}</category>`)
        .join("\n");
      return `  <item>
    <title>${escape(p.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escape(p.description)}</description>
${categories}
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escape(SITE_TITLE)}</title>
  <link>${SITE_URL}</link>
  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
  <description>${escape(SITE_DESCRIPTION)}</description>
  <language>ko</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
