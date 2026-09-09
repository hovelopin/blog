import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  // 조회수 API 가 런타임에 글 목록을 읽는다. 파일 추적이 content/ 를
  // 자동으로 못 잡아서 서버리스 번들에 직접 넣어준다.
  outputFileTracingIncludes: {
    "/api/views/*": ["./content/posts/**/*"],
  },
  // /blog → /posts 로 경로를 통합하면서 기존 링크·검색엔진 색인은 301로 넘긴다.
  async redirects() {
    return [
      { source: "/blog", destination: "/posts", permanent: true },
      {
        source: "/blog/tag/:tag",
        destination: "/posts/tag/:tag",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
