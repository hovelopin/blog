import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import {
  getAllDiaryEntries,
  getAllPostSummaries,
  getAllTags,
} from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, diary, tags] = await Promise.all([
    getAllPostSummaries(),
    getAllDiaryEntries(),
    getAllTags(),
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
      url: `${SITE_URL}/blog`,
      lastModified: posts[0] ? new Date(posts[0].date) : now,
      changeFrequency: "weekly",
      priority: 0.8,
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
    url: `${SITE_URL}/blog/tag/${encodeURIComponent(t.tag)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.3,
  }));

  return [...staticRoutes, ...postRoutes, ...diaryRoutes, ...tagRoutes];
}
