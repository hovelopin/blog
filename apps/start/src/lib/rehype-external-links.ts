import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { SITE_URL } from "./site";

/**
 * 본문의 바깥 링크를 새 탭에서 열게 한다.
 * noopener 는 열린 페이지가 window.opener 로 원래 탭을 건드리는 걸 막는다.
 */
export function externalLinkPlugin() {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string") return;
      // 상대 경로와 내 도메인, 그리고 #앵커·mailto: 는 그대로 둔다.
      if (!/^https?:\/\//.test(href)) return;
      if (href.startsWith(SITE_URL)) return;
      node.properties = {
        ...node.properties,
        target: "_blank",
        rel: "noreferrer noopener",
      };
    });
  };
}
