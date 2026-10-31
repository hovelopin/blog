import "react";

/**
 * `<blog-demo>` 를 JSX 에서 쓸 수 있게 react 의 JSX 네임스페이스를 증강한다.
 * 최상위 import 가 있어 모듈 파일이고, 그래서 `declare module "react"` 가
 * 대체가 아니라 증강으로 처리된다.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "blog-demo": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        name: string;
        "min-height"?: number;
      };
    }
  }
}
