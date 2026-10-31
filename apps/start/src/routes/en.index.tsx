import { createFileRoute } from "@tanstack/react-router";
import { PostsIndex } from "@/components/pages/posts-index";
import { pageHead } from "@/lib/head";
import { getPostsIndex } from "@/lib/server-fns";

export const Route = createFileRoute("/en/")({
  loader: () => getPostsIndex({ data: "en" }),
  head: () =>
    pageHead({
      title: "English articles",
      description: "Articles from this blog that have an English version.",
      path: "/en",
      alternates: [{ lang: "ko-KR", path: "/" }],
    }),
  component: () => {
    const { posts, tags } = Route.useLoaderData();
    return <PostsIndex locale="en" posts={posts} tags={tags} />;
  },
});
