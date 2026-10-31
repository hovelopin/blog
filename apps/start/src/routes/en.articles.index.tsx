import { createFileRoute } from "@tanstack/react-router";
import { PostsIndex } from "@/components/pages/posts-index";
import { pageHead } from "@/lib/head";
import { getPostsIndex } from "@/lib/server-fns";

export const Route = createFileRoute("/en/articles/")({
  loader: () => getPostsIndex({ data: "en" }),
  head: () =>
    pageHead({
      title: "Articles",
      description: "Long-form writing about frontend engineering.",
      path: "/en/articles",
      alternates: [{ lang: "ko-KR", path: "/articles" }],
    }),
  component: () => {
    const { posts, tags } = Route.useLoaderData();
    return <PostsIndex locale="en" posts={posts} tags={tags} />;
  },
});
