import { createFileRoute, notFound } from "@tanstack/react-router";
import { Link } from "@/components/link";
import { PostCard } from "@/components/post-card";
import { pageHead } from "@/lib/head";
import { getPostsByTag } from "@/lib/server-fns";

export const Route = createFileRoute("/articles/tag/$tag")({
  loader: async ({ params }) => {
    const posts = await getPostsByTag({ data: params.tag });
    if (posts.length === 0) throw notFound();
    return { tag: params.tag, posts };
  },
  head: ({ params }) =>
    pageHead({
      title: `#${params.tag}`,
      description: `태그 '${params.tag}'로 필터링된 글 모음.`,
      path: `/articles/tag/${encodeURIComponent(params.tag)}`,
    }),
  component: TagPage,
});

function TagPage() {
  const { tag, posts } = Route.useLoaderData();
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <Link
        href="/articles"
        className="mb-10 inline-flex items-center font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← cd ~/posts
      </Link>

      <header className="mb-10">
        <p className="mb-3 font-mono text-xs text-primary">
          ~/hovelopin/articles $ grep -l &apos;#{tag}&apos;
        </p>
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          #{tag}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{posts.length}개의 글.</p>
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
      </div>
    </div>
  );
}
