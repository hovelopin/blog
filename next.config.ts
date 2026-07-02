import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
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
