import type { Metadata } from "next";
import Link from "next/link";
import { BusinessCard } from "@/components/business-card";
import { BookCover } from "@/components/book-cover";
import { PostCard } from "@/components/post-card";
import { DiaryLog } from "@/components/diary-log";
import { HorizontalScroller } from "@/components/horizontal-scroller";
import { JsonLd } from "@/components/json-ld";
import { getAllBooks, getAllDiaryEntries, getAllPostSummaries } from "@/lib/content";
import { AUTHOR, SITE_DESCRIPTION, SITE_LANG, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

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

export default async function Home() {
  const [posts, diary, books] = await Promise.all([
    getAllPostSummaries(),
    getAllDiaryEntries(),
    getAllBooks(),
  ]);
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
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-mono text-sm text-muted-foreground"># recent posts</h2>
          <Link href="/posts" className="font-mono text-xs text-primary hover:underline">
            see all ({posts.length}) →
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 글이 없습니다. <code>content/posts</code>에 마크다운 파일을 추가하세요.
          </p>
        ) : (
          // 최신 글 하나를 왼쪽에 크게 두고, 그다음 두 편을 오른쪽에 쌓는 배치.
          // 좁아지면 한 줄로 펴고(오른쪽 두 장은 나란히), 더 좁아지면 전부 세로로 쌓인다.
          <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
            <PostCard post={recentPosts[0]} variant="bento" />
            {recentPosts.length > 1 && (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                {recentPosts.slice(1).map((post) => (
                  <PostCard key={post.slug} post={post} variant="compact" />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {recentBooks.length > 0 && (
        <section className="mb-14 sm:mb-20">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-mono text-sm text-muted-foreground"># bookshelf</h2>
            <Link href="/research" className="font-mono text-xs text-primary hover:underline">
              see all ({books.length}) →
            </Link>
          </div>
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
                  <p className="mt-3 truncate text-[13px] font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {book.title}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {book.repo ?? book.description}
                  </p>
                </Link>
              ))}
            </HorizontalScroller>
          </div>
        </section>
      )}

      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-mono text-sm text-muted-foreground"># recent diary</h2>
          <Link href="/diary" className="font-mono text-xs text-primary hover:underline">
            see all →
          </Link>
        </div>
        {recentDiary.length === 0 ? (
          <p className="text-sm text-muted-foreground">다이어리가 비어 있습니다.</p>
        ) : (
          <DiaryLog entries={recentDiary} />
        )}
      </section>
    </div>
  );
}
