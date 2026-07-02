import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import {
  getAllBooks,
  getAllDiaryEntries,
  getAllPostSummaries,
  getAllTags,
} from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, diary, tags, books] = await Promise.all([
    getAllPostSummaries(),
    getAllDiaryEntries(),
    getAllTags(),
    getAllBooks(),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/posts`,
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
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/posts/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const diaryRoutes: MetadataRoute.Sitemap = diary.map((d) => ({
    url: `${SITE_URL}/diary/${d.slug}`,
    lastModified: new Date(d.date),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${SITE_URL}/posts/tag/${encodeURIComponent(t.tag)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.3,
  }));

  const bookRoutes: MetadataRoute.Sitemap = books.map((b) => ({
    url: `${SITE_URL}/research/${b.slug}`,
    lastModified: new Date(b.date),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const chapterRoutes: MetadataRoute.Sitemap = books.flatMap((b) =>
    b.chapters.map((c) => ({
      url: `${SITE_URL}/research/${b.slug}/${c.slug}`,
      lastModified: new Date(b.date),
      changeFrequency: "monthly",
      priority: 0.4,
    })),
  );

  return [
    ...staticRoutes,
    ...postRoutes,
    ...diaryRoutes,
    ...tagRoutes,
    ...bookRoutes,
    ...chapterRoutes,
  ];
}
