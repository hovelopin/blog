import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostArticle } from "@/components/pages/post-article";
import { postHead } from "@/lib/head";
import { getPostPage } from "@/lib/server-fns";

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ params }) => {
    const data = await getPostPage({ data: { slug: params.slug, locale: "ko" } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => (loaderData ? postHead(loaderData.post, "ko", loaderData.hasOther) : {}),
  component: () => <PostArticle {...Route.useLoaderData()} locale="ko" />,
});
