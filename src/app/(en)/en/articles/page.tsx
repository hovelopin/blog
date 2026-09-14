import type { Metadata } from "next";
import { PostsIndex } from "@/components/pages/posts-index";

export const metadata: Metadata = {
  title: "Articles",
  description: "Long-form writing about frontend engineering.",
  alternates: { canonical: "/en/articles", languages: { "ko-KR": "/articles" } },
};

export default function EnPostsPage() {
  return <PostsIndex locale="en" />;
}
