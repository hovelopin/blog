import type { Metadata } from "next";
import { PostsIndex } from "@/components/pages/posts-index";

export const metadata: Metadata = {
  title: "English posts",
  description: "Posts from this blog that have an English version.",
  alternates: { canonical: "/en", languages: { "ko-KR": "/" } },
};

export default function EnHomePage() {
  return <PostsIndex locale="en" />;
}
