import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // 조회수 API 가 런타임에 글 목록을 읽는다. 파일 추적이 content/ 를
  // 자동으로 못 잡아서 서버리스 번들에 직접 넣어준다.
  outputFileTracingIncludes: {
    "/api/views/*": ["./content/posts/**/*"],
  },
  // 옛 주소는 전부 301 로 새 주소에 넘긴다. /blog 는 그보다 앞선 세대의 주소다.
  async redirects() {
    return [
      { source: "/blog", destination: "/articles", permanent: true },
      { source: "/blog/tag/:tag", destination: "/articles/tag/:tag", permanent: true },
      { source: "/posts", destination: "/articles", permanent: true },
      { source: "/posts/tag/:tag", destination: "/articles/tag/:tag", permanent: true },
      { source: "/posts/:slug", destination: "/articles/:slug", permanent: true },
      { source: "/en/posts", destination: "/en/articles", permanent: true },
      { source: "/en/posts/:slug", destination: "/en/articles/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
