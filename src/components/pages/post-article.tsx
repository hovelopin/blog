import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdjacentPosts,
  getPostBySlug,
  getRelatedPosts,
  getSeriesContext,
  hasPostTranslation,
} from "@/lib/content";
import { formatDate } from "@/lib/format";
import { AUTHOR, absoluteUrl } from "@/lib/site";
import { LOCALE_META, localePath, type Locale } from "@/lib/locale";
import { DynamicIslandTOC } from "@/components/dynamic-island-toc";
import { PostContent } from "@/components/post-content";
import { ViewCount } from "@/components/view-count";
import { MdxContent } from "@/components/mdx-content";
import { PostFooterNav } from "@/components/post-footer-nav";
import { PostComments } from "@/components/post-comments";
import { PostLocaleSwitch } from "@/components/post-locale-switch";
import { SeriesNav } from "@/components/series-nav";
import { JsonLd } from "@/components/json-ld";

export async function PostArticle({ slug, locale }: { slug: string; locale: Locale }) {
  const post = await getPostBySlug(slug, locale);
  if (!post) notFound();
  const other: Locale = locale === "ko" ? "en" : "ko";
  const hasOther = await hasPostTranslation(slug, other);
  const at = (path: string) => localePath(locale, path);

  const [{ prev, next }, related, series] = await Promise.all([
    getAdjacentPosts(slug),
    getRelatedPosts(slug, post.tags),
    getSeriesContext(slug),
  ]);

  const postUrl = absoluteUrl(at(`/posts/${slug}`));
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: LOCALE_META[locale].lang,
    author: {
      "@type": "Person",
      name: post.author ?? AUTHOR.name,
      url: AUTHOR.url,
    },
    publisher: { "@type": "Person", name: AUTHOR.fullName, url: AUTHOR.url },
    mainEntityOfPage: postUrl,
    url: postUrl,
    ...(post.cover ? { image: absoluteUrl(post.cover) } : {}),
    ...(post.tags && post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl(at("/")) },
      {
        "@type": "ListItem",
        position: 2,
        name: "Posts",
        item: absoluteUrl(at("/posts")),
      },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <JsonLd data={[blogPostingJsonLd, breadcrumbJsonLd]} />
      {post.headings.length > 0 && <DynamicIslandTOC headings={post.headings} />}
      <Link
        href={at("/")}
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
          <ViewCount slug={post.slug} />
        </div>
        {hasOther && (
          <div className="mb-4">
            <PostLocaleSwitch slug={slug} current={locale} other={other} />
          </div>
        )}
        <h1 className="mb-4 text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]">
          {post.title}
        </h1>
        <p className="text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
          {post.description}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={at(`/posts/tag/${encodeURIComponent(tag)}`)}
                className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {series && <SeriesNav context={series} />}

      <PostContent>
        <MdxContent source={post.content} linkPreviews={post.linkPreviews} />
      </PostContent>

      <PostFooterNav prev={prev} next={next} related={related} series={series} />

      <PostComments slug={post.slug} title={post.title} />

      <footer className="mt-12 border-t border-border/60 pt-8">
        <Link href={at("/posts")} className="font-mono text-xs text-primary hover:underline">
          {locale === "ko" ? "← 다른 글 보기" : "← Browse all posts"}
        </Link>
      </footer>
    </article>
  );
}
