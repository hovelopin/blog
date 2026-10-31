import { createFileRoute, redirect } from "@tanstack/react-router";

/** 옛 주소. 301 로 새 주소에 넘긴다. */
export const Route = createFileRoute("/posts/")({
  beforeLoad: () => {
    throw redirect({ href: "/articles", statusCode: 301 });
  },
});
