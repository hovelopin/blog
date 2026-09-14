import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { TagList } from "@/components/tag-list";
import { getAllPostSummaries, getAllTags } from "@/lib/content";
import { DEFAULT_LOCALE, localePath, type Locale } from "@/lib/locale";

/** 두 언어의 글 목록이 공유하는 본문. 링크와 안내 문구만 언어를 탄다. */
export async function PostsIndex({ locale }: { locale: Locale }) {
  const [posts, tags] = await Promise.all([getAllPostSummaries(locale), getAllTags()]);
  const ko = locale === DEFAULT_LOCALE;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href={localePath(locale, "/")}
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← cd ~
      </Link>

      <header className="mb-10">
        <p className="mb-3 font-mono text-xs text-primary">~/hovelopin/articles $ ls -lah</p>
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          articles
        </h1>
        {ko && <TagList tags={tags} />}
      </header>

      <div className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <PostCard
            key={post.slug}
            post={post}
            locale={locale}
            variant={i === 0 ? "feature" : "default"}
            className={i === 0 ? "mb-2" : undefined}
          />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {ko ? (
              <>
                아직 글이 없습니다. <code>content/posts</code>에 마크다운 파일을 추가하세요.
              </>
            ) : (
              <>No articles translated yet.</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
