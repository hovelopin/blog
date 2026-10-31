import { federation } from "@module-federation/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * 데모 리모트.
 *
 * - `./register` : 모든 데모 렌더러를 `<blog-demo>` 레지스트리에 등록한다 (Lit 경로).
 * - `./ThrottleDemo` : React 컴포넌트를 그대로 노출한다 (호스트가 lazyRemote 로 SSR 하는 경로).
 * - `./probe` : 호스트가 React 싱글톤 공유를 검증할 때 쓴다.
 */
export default defineConfig({
  plugins: [
    federation({
      name: "demos",
      filename: "remoteEntry.js",
      manifest: true,
      exposes: {
        "./register": "./src/register.ts",
        "./ThrottleDemo": "./src/demos/throttle-demo.tsx",
        "./probe": "./src/probe.ts",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.0" },
        lit: { singleton: true, requiredVersion: "^3.3.0" },
      },
    }),
    tailwindcss(),
    react(),
  ],
  // `vite build --app` 이 client 와 ssr 환경을 모두 빌드한다.
  // MF 플러그인이 ssr 환경에서 remoteEntry.ssr.js 를 만들어 client 출력 옆에 놓고,
  // mf-manifest.json 의 metaData.ssrRemoteEntry 로 광고한다. 호스트는 이걸로 서버 렌더한다.
  builder: {},
  environments: {
    ssr: {
      build: {
        outDir: "dist/ssr",
        rollupOptions: { input: "./src/ssr-entry.ts" },
      },
    },
  },
  build: {
    // Module Federation 의 ESM 리모트는 top-level await 를 쓴다.
    target: "chrome89",
  },
});
