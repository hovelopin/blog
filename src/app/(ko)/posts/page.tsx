import type { Metadata } from "next";
import { PostsIndex } from "@/components/pages/posts-index";

export const metadata: Metadata = {
  title: "Posts",
  description: "개발과 관련된 긴 호흡의 글.",
  alternates: { canonical: "/posts", languages: { "en-US": "/en/posts" } },
};

export default function PostsPage() {
  return <PostsIndex locale="ko" />;
}
