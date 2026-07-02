import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAdjacentPosts,
  getAllPostSlugs,
  getPostBySlug,
  getRelatedPosts,
  getSeriesContext,
} from "@/lib/content";
import { formatDate } from "@/lib/format";
import { AUTHOR, SITE_LANG, absoluteUrl } from "@/lib/site";
import { DynamicIslandTOC } from "@/components/dynamic-island-toc";
import { PostContent } from "@/components/post-content";
import { PostFooterNav } from "@/components/post-footer-nav";
import { PostComments } from "@/components/post-comments";
import { SeriesNav } from "@/components/series-nav";
import { JsonLd } from "@/components/json-ld";

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
  const url = `/posts/${slug}`;
  const images = post.cover
    ? [{ url: post.cover, alt: post.coverAlt ?? post.title }]
    : undefined;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [post.author ?? AUTHOR.name],
      tags: post.tags,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [{ prev, next }, related, series] = await Promise.all([
    getAdjacentPosts(slug),
    getRelatedPosts(slug, post.tags),
    getSeriesContext(slug),
  ]);

  const postUrl = absoluteUrl(`/posts/${slug}`);
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: SITE_LANG,
    author: {
      "@type": "Person",
      name: post.author ?? AUTHOR.name,
      url: AUTHOR.url,
    },
    publisher: { "@type": "Person", name: AUTHOR.fullName, url: AUTHOR.url },
    mainEntityOfPage: postUrl,
    url: postUrl,
    ...(post.cover ? { image: absoluteUrl(post.cover) } : {}),
    ...(post.tags && post.tags.length > 0
      ? { keywords: post.tags.join(", ") }
      : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Posts",
        item: absoluteUrl("/posts"),
      },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <JsonLd data={[blogPostingJsonLd, breadcrumbJsonLd]} />
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
                href={`/posts/tag/${encodeURIComponent(tag)}`}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {series && <SeriesNav context={series} />}

      <PostContent html={post.content} />

      <PostFooterNav
        prev={prev}
        next={next}
        related={related}
        series={series}
      />

      <PostComments slug={post.slug} title={post.title} />

      <footer className="mt-12 border-t border-border/60 pt-8">
        <Link
          href="/posts"
          className="font-mono text-xs text-primary hover:underline"
        >
          ← 다른 글 보기
        </Link>
      </footer>
    </article>
  );
}
