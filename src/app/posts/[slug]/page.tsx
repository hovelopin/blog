import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAdjacentPosts,
  getAllPostSlugs,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/content";
import { formatDate } from "@/lib/format";
import { DynamicIslandTOC } from "@/components/dynamic-island-toc";
import { PostContent } from "@/components/post-content";
import { PostFooterNav } from "@/components/post-footer-nav";
import { PostComments } from "@/components/post-comments";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [{ prev, next }, related] = await Promise.all([
    getAdjacentPosts(slug),
    getRelatedPosts(slug, post.tags),
  ]);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      {post.headings.length > 0 && (
        <DynamicIslandTOC headings={post.headings} />
      )}
      <Link
        href="/"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← back to index
      </Link>

      <header className="mb-10 border-b border-border/60 pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTimeMinutes} min read</span>
          {post.author && (
            <>
              <span aria-hidden="true">·</span>
              <span>@{post.author}</span>
            </>
          )}
        </div>
        <h1 className="mb-4 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          {post.description}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      <PostContent html={post.content} />

      <PostFooterNav prev={prev} next={next} related={related} />

      <PostComments slug={post.slug} title={post.title} />

      <footer className="mt-12 border-t border-border/60 pt-8">
        <Link
          href="/blog"
          className="font-mono text-xs text-primary hover:underline"
        >
          ← 다른 글 보기
        </Link>
      </footer>
    </article>
  );
}
