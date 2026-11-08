import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/link";
import { ArticleList } from "@/components/article-list";
import { SectionHeader } from "@/components/section-header";
import { BookCover } from "@/components/book-cover";
import { BusinessCard } from "@/components/business-card";
import { DiaryLog } from "@/components/diary-log";
import { HorizontalScroller } from "@/components/horizontal-scroller";
import { JsonLd } from "@/components/json-ld";
import { pageHead } from "@/lib/head";
import { getHomeData } from "@/lib/server-fns";
import { AUTHOR, SITE_DESCRIPTION, SITE_LANG, SITE_NAME, SITE_URL } from "@/lib/site";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: SITE_LANG,
      publisher: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: AUTHOR.fullName,
      alternateName: AUTHOR.name,
      url: SITE_URL,
      sameAs: AUTHOR.sameAs,
    },
  ],
};

export const Route = createFileRoute("/")({
  loader: () => getHomeData(),
  head: () => ({ links: pageHead({ title: SITE_NAME, description: SITE_DESCRIPTION, path: "/" }).links }),
  component: Home,
});

function Home() {
  const { posts, diary, books } = Route.useLoaderData();
  const recentPosts = posts.slice(0, 3);
  const recentDiary = diary.slice(0, 3);
  const recentBooks = books.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <JsonLd data={websiteJsonLd} />
      <section className="mb-14 sm:mb-20">
        <BusinessCard />
      </section>

      <section className="mb-14 sm:mb-20">
        <SectionHeader title="articles" more={{ href: "/articles", label: "all articles" }} />
        {recentPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 글이 없습니다. <code>content/posts</code>에 마크다운 파일을 추가하세요.
          </p>
        ) : (
          <ArticleList posts={recentPosts} />
        )}
      </section>

      {recentBooks.length > 0 && (
        <section className="mb-14 sm:mb-20">
          <SectionHeader title="bookshelf" more={{ href: "/research", label: "all books" }} />
          <div className="-mx-5 sm:-mx-6">
            <HorizontalScroller step={172}>
              {recentBooks.map((book) => (
                <Link
                  key={book.slug}
                  href={`/research/${book.slug}`}
                  className="group flex w-[150px] shrink-0 snap-start flex-col"
                  aria-label={`${book.title} — ${book.description}`}
                >
                  <BookCover book={book} />
                  <p className="mt-3 truncate text-[13.6px] font-semibold leading-[1.4] text-foreground/85 transition-colors group-hover:text-primary">
                    {book.title}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] leading-[1.5] text-muted-foreground">
                    {book.repo ?? book.description}
                  </p>
                </Link>
              ))}
            </HorizontalScroller>
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="diary" more={{ href: "/diary", label: "all diary" }} />
        {recentDiary.length === 0 ? (
          <p className="text-sm text-muted-foreground">다이어리가 비어 있습니다.</p>
        ) : (
          <DiaryLog entries={recentDiary} />
        )}
      </section>
    </div>
  );
}
