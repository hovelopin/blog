import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { TagList } from "@/components/tag-list";
import { getAllPostSummaries, getAllTags } from "@/lib/content";

export const metadata: Metadata = {
  title: "Posts",
  description: "개발과 관련된 긴 호흡의 글.",
  alternates: { canonical: "/posts" },
};

export default async function PostsPage() {
  const [posts, tags] = await Promise.all([getAllPostSummaries(), getAllTags()]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← cd ~
      </Link>

      <header className="mb-10">
        <p className="mb-3 font-mono text-xs text-primary">~/hovelopin/posts $ ls -lah</p>
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          posts
        </h1>
        <TagList tags={tags} />
      </header>

      <div className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <PostCard
            key={post.slug}
            post={post}
            variant={i === 0 ? "feature" : "default"}
            className={i === 0 ? "mb-2" : undefined}
          />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            아직 글이 없습니다. <code>content/posts</code>에 마크다운 파일을 추가하세요.
          </p>
        )}
      </div>
    </div>
  );
}
