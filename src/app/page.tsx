import Link from "next/link";
import { BusinessCard } from "@/components/business-card";
import { DynamicCard } from "@/components/dynamic-card";
import { DiaryLog } from "@/components/diary-log";
import { HorizontalScroller } from "@/components/horizontal-scroller";
import { getAllDiaryEntries, getAllPostSummaries } from "@/lib/content";

export default async function Home() {
  const [posts, diary] = await Promise.all([
    getAllPostSummaries(),
    getAllDiaryEntries(),
  ]);
  const recentPosts = posts.slice(0, 3);
  const recentDiary = diary.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <section className="mb-14 sm:mb-20">
        <BusinessCard />
      </section>

      <section className="mb-14 sm:mb-20">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-mono text-sm text-muted-foreground">
            # recent posts
          </h2>
          <Link
            href="/blog"
            className="font-mono text-xs text-primary hover:underline"
          >
            see all ({posts.length}) →
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 글이 없습니다. <code>content/posts</code>에 마크다운 파일을
            추가하세요.
          </p>
        ) : (
          <div className="-mx-5 sm:-mx-6">
            <HorizontalScroller>
              {recentPosts.map((post) => (
                <div key={post.slug} className="shrink-0 snap-start">
                  <DynamicCard post={post} />
                </div>
              ))}
            </HorizontalScroller>
          </div>
        )}
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-mono text-sm text-muted-foreground">
            # recent diary
          </h2>
          <Link
            href="/diary"
            className="font-mono text-xs text-primary hover:underline"
          >
            see all →
          </Link>
        </div>
        {recentDiary.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            다이어리가 비어 있습니다.
          </p>
        ) : (
          <DiaryLog entries={recentDiary} />
        )}
      </section>
    </div>
  );
}
