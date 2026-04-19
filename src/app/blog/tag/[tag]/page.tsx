import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { getAllTags, getPostsByTag } from "@/lib/content";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ tag }) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `#${decoded}`,
    description: `태그 '${decoded}'로 필터링된 글 모음.`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await getPostsByTag(decoded);
  if (posts.length === 0) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/blog"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← cd ~/blog
      </Link>

      <header className="mb-10">
        <p className="mb-3 font-mono text-xs text-primary">
          ~/hovelopin/blog $ grep -l &apos;#{decoded}&apos;
        </p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          #{decoded}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {posts.length}개의 글.
        </p>
      </header>

      <div className="flex flex-col gap-5 sm:gap-6">
        {posts.map((post, i) => {
          const variant =
            i % 4 === 0
              ? "feature"
              : i % 2 === 1
                ? "image-left"
                : "image-right";
          return <PostCard key={post.slug} post={post} variant={variant} />;
        })}
      </div>
    </div>
  );
}
