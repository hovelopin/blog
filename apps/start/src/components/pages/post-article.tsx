import { Link } from "@/components/link";
import { DynamicIslandTOC } from "@/components/dynamic-island-toc";
import { JsonLd } from "@/components/json-ld";
import { MdxContent } from "@/components/mdx-content";
import { PostComments } from "@/components/post-comments";
import { PostContent } from "@/components/post-content";
import { PostFooterNav } from "@/components/post-footer-nav";
import { PostLocaleSwitch } from "@/components/post-locale-switch";
import { SeriesNav } from "@/components/series-nav";
import { ViewCount } from "@/components/view-count";
import { formatDate } from "@/lib/format";
import { LOCALE_META, localePath, type Locale } from "@/lib/locale";
import type { PostPageData } from "@/lib/server-fns";
import { AUTHOR, absoluteUrl } from "@/lib/site";

interface PostArticleProps extends PostPageData {
  locale: Locale;
}

/** 두 언어의 글 상세가 공유하는 본문. 데이터는 라우트 로더가 서버 함수로 받아 넘긴다. */
export function PostArticle({ post, hasOther, prev, next, related, series, locale }: PostArticleProps) {
  const other: Locale = locale === "ko" ? "en" : "ko";
  const at = (path: string) => localePath(locale, path);

  const postUrl = absoluteUrl(at(`/articles/${post.slug}`));
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: LOCALE_META[locale].lang,
    author: { "@type": "Person", name: post.author ?? AUTHOR.name, url: AUTHOR.url },
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
      { "@type": "ListItem", position: 2, name: "Articles", item: absoluteUrl(at("/articles")) },
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
            <PostLocaleSwitch slug={post.slug} current={locale} other={other} />
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
                // 태그 페이지는 한국어에만 있다. 영어 글에서도 한국어 태그 목록으로 보낸다.
                href={`/articles/tag/${encodeURIComponent(tag)}`}
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
        <MdxContent code={post.body} />
      </PostContent>

      <PostFooterNav prev={prev} next={next} related={related} series={series} />

      <PostComments slug={post.slug} title={post.title} />

      <footer className="mt-12 border-t border-border/60 pt-8">
        <Link href={at("/articles")} className="font-mono text-xs text-primary hover:underline">
          {locale === "ko" ? "← 다른 글 보기" : "← Browse all articles"}
        </Link>
      </footer>
    </article>
  );
}
