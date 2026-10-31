import contentCollections from "@content-collections/vite";
import { tanstackStartModuleFederation } from "@module-federation/tanstack/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

/** 리모트 오리진. 배포에서는 리모트 프로젝트의 도메인을 넣는다. */
const DEMOS_ORIGIN = process.env.DEMOS_ORIGIN ?? "http://localhost:3001";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // 마크다운 → 컴파일된 MDX. 빌드 시 content/ 를 읽어 `content-collections` 모듈을 만든다.
    contentCollections(),
    // MF 래퍼가 tanstackStart() 보다 앞에 와야 클라이언트·SSR 엔트리를 정규화할 수 있다.
    tanstackStartModuleFederation({
      name: "host",
      // 리모트 타입은 src/remotes.d.ts 에 직접 쓴다. 켜 두면 dev 에서 SSR 모듈 러너가
      // dts-plugin 의 런타임 플러그인을 못 찾아 서버 렌더가 깨진다 (pnpm 비호이스팅).
      dts: false,
      // <blog-demo> 를 정의하는 Lit 을 리모트와 한 벌로 쓴다. 두 벌이면 "Multiple versions of Lit" 경고가 뜬다.
      shared: { lit: { singleton: true, requiredVersion: "^3.3.0" } },
      remotes: {
        demos: {
          type: "module",
          name: "demos",
          entry: `${DEMOS_ORIGIN}/remoteEntry.js`,
        },
      },
    }),
    tanstackStart({
      // 글은 전부 정적 HTML 로 만든다. 서버 함수는 조회수 같은 부가 기능에만 쓴다.
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    // 배포 어댑터. 프리셋은 배포 환경이 자동 감지한다(로컬 확인은 NITRO_PRESET=vercel).
    // 프리렌더된 페이지는 정적 파일로 나가고, 서버 라우트는 하나의 Nitro 함수에 모인다.
    // 옛 주소 리다이렉트는 Nitro routeRules 가 아니라 라우트(src/routes/posts.*.tsx 등)에서 301 로 처리한다 —
    // routeRules 의 statusCode 가 Vercel 설정에서는 307 로 바뀐다.
    nitro(),
    tailwindcss(),
    react(),
  ],
});
