import type { Metadata } from "next";
import { PostArticle } from "@/components/pages/post-article";
import { postMetadata } from "@/lib/post-metadata";
import { getAllPostSlugs } from "@/lib/content";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs("ko");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  return postMetadata(slug, "ko");
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  return <PostArticle slug={slug} locale="ko" />;
}
