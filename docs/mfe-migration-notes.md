# 마이크로프론트엔드 마이그레이션 작업 노트

TanStack Start 호스트 + Vite React 리모트 + Lit 계약 층으로 블로그를 재구축하면서
나중에 글로 옮길 사실·수치를 그때그때 적는다. 측정값은 재현 조건과 함께 남긴다.

## 결정

- 2026-10-31 Next.js(App Router, Turbopack) 호스트 포기. `nextjs-mf` 는 App Router 를 빌드 실패시키고
  Next 16 에서 webpack 플러그인이 깨졌으며(core#3153, 2026-05 not planned 로 종료), Next 는 호스트만 가능.
- 호스트 TanStack Start 1.169 (Vite 8.3) + `@module-federation/tanstack` 0.1.1. 리모트 `@module-federation/vite` 1.23.7.
- 계약 층 `packages/ui`: `<blog-demo name="…">` 커스텀 엘리먼트 + `globalThis` 심볼 레지스트리.

## PoC 결과

| # | 검증 | 결과 | 비고 |
|---|---|---|---|
| ① | 공유 React 싱글톤 | ✅ `createElement`/`useState`/`createRoot` 동일 인스턴스 | 네임스페이스 객체 `===` 는 MF 래퍼 때문에 거짓 → 함수 동일성으로 재야 함 |
| ② | 리모트가 Lit 엘리먼트 export → 호스트 렌더 | ✅ | light DOM, 토큰은 CSS 변수 |
| ②' | federated SSR (lazyRemote) | ✅ 서버 HTML 에 `<canvas>` 포함 | 순수 Vite 리모트는 `environments.ssr` 명시 + `vite build --app` 필요 |
| ③ | content-collections + Shiki 프리렌더 | ✅ 글 11편 정적 HTML | `compileMDX` 에 기존 remark/rehype 그대로 |
| ④ | Vercel 함수 수 | ✅ `__server.func` 1개 (최종: 정적 77페이지) | `NITRO_PRESET=vercel`, 정적 12페이지 → `handle: filesystem` 우선, `/assets` immutable 1년. 조회수 API 는 같은 함수 안의 라우트 |

## 만난 문제

1. dev 에서 SSR 모듈 러너가 `@module-federation/dts-plugin/dynamic-remote-type-hints-plugin` 을 못 찾음
   (pnpm 비호이스팅). optimizeDeps 쪽만 경로를 풀어 주고 SSR 주입 import 는 bare specifier 그대로라 비대칭.
   → `dts: false` 로 우회. 업스트림 보고 후보.
2. 리모트에 SSR 엔트리가 없으면 호스트가 브라우저용 `remoteEntry.js` 를 Node 에서 평가하려다
   `vm.SourceTextModule is not a constructor` 로 실패. README 에 "Vite 리모트는 추가 설정 없음"이라고만 있음.
   → `builder: {}` + `environments.ssr.build.rollupOptions.input`(빈 모듈) + `vite build --app`.
3. `declare module "react"` 를 스크립트 파일에 두면 증강이 아니라 대체가 됨 → 모듈 파일(`import "react"`)로 분리.
4. TanStack `Link` 의 `to` 는 라우트 리터럴만 받아 `/articles/${slug}` 같은 문자열을 못 넘김. `buildLocation` 은
   `href` 가 있으면 `to` 를 덮어쓰므로 `to="." href={href}` 래퍼(`components/link.tsx`)로 해결.
5. content-collections 설정은 esbuild+Node 로 따로 실행된다 — `import.meta.env` 가 없어 `site.ts` 가 터짐 → 옵셔널 체이닝 + `process.env` 폴백.
   컬렉션 이름은 복수형으로 바뀐다(`postsEn` → `allPostsEns`). `interface` 는 Serializable 제약(인덱스 시그니처)을 못 넘어 `type` 으로.
6. Nitro `routeRules.redirect.statusCode: 301` 이 Vercel 설정에서는 307 로 나옴 → 리다이렉트를 TanStack 라우트의 `redirect({ href, statusCode: 301 })` 로 옮김.
7. `<blog-demo>` 의 `disconnectedCallback` 에서 리모트 React 루트를 동기 unmount 하면 호스트 React 커밋 중이라
   "Attempted to synchronously unmount a root while React was already rendering" → `setTimeout(…, 0)` 로 한 틱 지연.
8. 프리렌더는 링크 크롤 기반이라 어디서도 링크하지 않는 다이어리 개별 글이 빠졌다 → 다이어리 카드의 날짜를 글 링크로.
   영어 글의 태그 링크가 존재하지 않는 `/en/articles/tag/*` 를 가리켜 크롤이 실패(Next 시절부터 404였던 버그) → 한국어 태그 페이지로.

## 측정

### M1. 글 본문 번들이 클라이언트에 실리는 크기

조건: `apps/start` `vite build`, 글 11편(비공개 제외), 2026-10-31.

| 상태 | `allPosts-*.js` (client) | gzip |
|---|---|---|
| before — 라우트가 `allPosts` 직접 import | 1,161,662 B | 202,751 B |
| after — `createServerFn` 으로 글 하나만 로드 | 0 B (청크 자체가 사라짐) | — |

- 글 페이지 HTML: 104,795 B → 92,520 B. 로더 데이터에 글 하나의 body 만 들어간다.
- 서버 함수 스텁이 포함된 `posts-*.js` 는 12,192 B (gzip 4,967 B).
- 비교 기준선: `loadShare-eager-*.js` (React+ReactDOM+Router 공유) 340,993 B (gzip 107,426 B). 글 수와 무관한 고정 비용.
- 글 수가 늘수록 before 는 선형으로 커지고 after 는 그대로다. 글 11편 기준 1.16MB 차이.

## 마이그레이션 완료 상태 (2026-10-31)

- 루트 Next 앱 제거. 워크스페이스 루트 `package.json` 은 스크립트 위임만 한다.
- 라우트 전부 이전: 홈 · 글 목록/상세/태그 · research 책/챕터 · diary 목록/글 · `/en` 3종 · rss/sitemap/robots/llms/manifest · `/api/views` · 옛 주소 301 ×7.
- 검증: lint 오류 0, typecheck 3개 워크스페이스 통과, 프리렌더 77 페이지(렌더 오류 0), Vercel 함수 1개,
  브라우저에서 홈·글·목록의 하이드레이션·소프트 내비게이션·데모 마운트·콘솔 오류 0 확인.
- 데모 22개 전부 리모트로 이전. `lit` 도 MF shared 싱글톤.

### Vercel 설정 (대시보드에서 바꿔야 함)
1. 기존 프로젝트: Framework Preset 자동 감지/Other, **Root Directory `apps/start`**, Install `pnpm install`.
   환경변수 `DEMOS_ORIGIN=https://<리모트 도메인>`, Upstash 2개, (선택) `VITE_SITE_URL`.
2. 리모트용 새 프로젝트: Root Directory `apps/remotes`, Build `pnpm build`, Output `dist`, Framework Other. 정적 파일만이라 함수 0개.
   `remoteEntry.js`·청크는 다른 오리진에서 ESM 으로 불러오므로 CORS 가 필요하다 — `apps/remotes/vercel.json` 의 headers.
3. 호스트 빌드는 프리렌더 중 리모트를 서버에서 불러오므로 **리모트를 먼저 배포**한다.
