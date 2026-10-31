/**
 * Module Federation 리모트 모듈의 타입.
 * 리모트는 별도 빌드라 타입이 자동으로 오지 않는다. 노출 목록과 1:1 로 맞춘다.
 *
 * 이 파일은 최상위 import/export 가 없는 스크립트여야 한다. 그래야 아래 선언이
 * 앰비언트 모듈 선언으로 동작한다. (react 증강은 blog-elements.d.ts 에 따로 둔다.)
 */
declare module "demos/register" {
  export const registered: string[];
}

declare module "demos/ThrottleDemo" {
  export function ThrottleDemo(): import("react").JSX.Element;
}

declare module "demos/probe" {
  export const probe: {
    createElement: typeof import("react").createElement;
    useState: typeof import("react").useState;
    createRoot: typeof import("react-dom/client").createRoot;
    version: string;
  };
}
