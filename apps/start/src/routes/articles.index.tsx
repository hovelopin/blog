import { createFileRoute } from "@tanstack/react-router";
import { PostsIndex } from "@/components/pages/posts-index";
import { pageHead } from "@/lib/head";
import { getPostsIndex } from "@/lib/server-fns";

export const Route = createFileRoute("/articles/")({
  loader: () => getPostsIndex({ data: "ko" }),
  head: () =>
    pageHead({
      title: "Articles",
      description: "개발과 관련된 긴 호흡의 글.",
      path: "/articles",
      alternates: [{ lang: "en-US", path: "/en/articles" }],
    }),
  component: () => {
    const { posts, tags } = Route.useLoaderData();
    return <PostsIndex locale="ko" posts={posts} tags={tags} />;
  },
});
