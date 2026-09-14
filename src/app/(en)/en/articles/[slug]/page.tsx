import type { Metadata } from "next";
import { PostArticle } from "@/components/pages/post-article";
import { postMetadata } from "@/lib/post-metadata";
import { getAllPostSlugs } from "@/lib/content";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs("en");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  return postMetadata(slug, "en");
}

export default async function EnPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  return <PostArticle slug={slug} locale="en" />;
}
