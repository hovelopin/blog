import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getAllPostSummaries, getAllTags } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "개발과 관련된 긴 호흡의 글.",
};

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([
    getAllPostSummaries(),
    getAllTags(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← cd ~
      </Link>

      <header className="mb-10">
        <p className="mb-3 font-mono text-xs text-primary">
          ~/hovelopin/blog $ ls -lah
        </p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          blog
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          하나의 주제를 끝까지 파고드는 긴 글. {posts.length}개의 글.
        </p>
        {tags.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="text-muted-foreground/70">tags:</span>
            {tags.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className="group rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                #{tag}
                <span className="ml-1 text-muted-foreground/60 group-hover:text-primary/70">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="flex flex-col gap-5 sm:gap-6">
        {posts.map((post, i) => {
          const variant =
            i % 4 === 0
              ? "feature"
              : i % 2 === 1
                ? "image-left"
                : "image-right";
          const offset =
            i === 0
              ? ""
              : i % 3 === 1
                ? "sm:ml-5"
                : i % 3 === 2
                  ? "sm:mr-3"
                  : "sm:ml-1";
          return (
            <PostCard
              key={post.slug}
              post={post}
              variant={variant}
              className={offset}
            />
          );
        })}
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            아직 글이 없습니다. <code>content/posts</code>에 마크다운 파일을
            추가하세요.
          </p>
        )}
      </div>
    </div>
  );
}
