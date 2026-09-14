import type { Metadata } from "next";
import { PostsIndex } from "@/components/pages/posts-index";

export const metadata: Metadata = {
  title: "Articles",
  description: "개발과 관련된 긴 호흡의 글.",
  alternates: { canonical: "/articles", languages: { "en-US": "/en/articles" } },
};

export default function PostsPage() {
  return <PostsIndex locale="ko" />;
}
