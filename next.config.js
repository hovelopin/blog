/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // MDX 페이지에서 이미지 최적화를 위한 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },

  // 페이지 확장자 설정
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx']
};

module.exports = nextConfig;
