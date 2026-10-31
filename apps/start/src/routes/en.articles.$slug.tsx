import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostArticle } from "@/components/pages/post-article";
import { postHead } from "@/lib/head";
import { getPostPage } from "@/lib/server-fns";

export const Route = createFileRoute("/en/articles/$slug")({
  loader: async ({ params }) => {
    const data = await getPostPage({ data: { slug: params.slug, locale: "en" } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => (loaderData ? postHead(loaderData.post, "en", loaderData.hasOther) : {}),
  component: () => <PostArticle {...Route.useLoaderData()} locale="en" />,
});
