import { Link as RouterLink, type LinkComponentProps } from "@tanstack/react-router";

export type LinkProps = Omit<LinkComponentProps<"a">, "to" | "href" | "params" | "search"> & {
  /** 사이트 기준 절대 경로. `/articles/${slug}` 처럼 문자열로 조립한 주소를 그대로 받는다. */
  href: string;
};

/**
 * `href` 문자열을 받는 링크.
 *
 * TanStack 의 `Link` 는 `to` 에 라우트 리터럴을 요구해서 템플릿 문자열을 바로 넘길 수 없다.
 * 이 블로그는 글·책·태그 주소를 데이터에서 조립하므로 문자열 경로가 자연스럽다.
 * 라우터의 buildLocation 은 `href` 가 있으면 그것을 파싱해 `to`·search·hash 를 덮어쓰므로,
 * 타입을 만족시키는 `to="."` 는 자리만 채우고 실제 목적지는 `href` 가 정한다.
 */
export function Link({ href, ...rest }: LinkProps) {
  return <RouterLink to="." href={href} {...rest} />;
}
