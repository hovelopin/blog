import type { Metadata } from "next";
import { PostsIndex } from "@/components/pages/posts-index";

export const metadata: Metadata = {
  title: "Posts",
  description: "Long-form writing about frontend engineering.",
  alternates: { canonical: "/en/posts", languages: { "ko-KR": "/posts" } },
};

export default function EnPostsPage() {
  return <PostsIndex locale="en" />;
}
