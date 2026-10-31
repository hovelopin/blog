/**
 * ssr 환경 빌드의 형식적인 입력.
 * 실제 SSR 산출물(remoteEntry.ssr.js, 노출 모듈의 서버 번들)은 MF 플러그인이
 * ssr 환경의 buildStart 에서 직접 emit 한다. Vite 는 환경마다 입력이 하나는 있어야 해서 둔다.
 */
export {};
