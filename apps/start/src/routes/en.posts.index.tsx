import { createFileRoute, redirect } from "@tanstack/react-router";

/** 옛 주소. 301 로 새 주소에 넘긴다. */
export const Route = createFileRoute("/en/posts/")({
  beforeLoad: () => {
    throw redirect({ href: "/en/articles", statusCode: 301 });
  },
});
