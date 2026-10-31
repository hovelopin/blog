import fs from "node:fs";
import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { SITE_URL } from "./site";

/**
 * 링크 미리보기 스크린샷 목록.
 * `scripts/capture-link-previews.mjs` 가 빌드 전에 만들어 둔 manifest 를 읽는다.
 * 파일이 없으면(스크립트를 아직 안 돌린 로컬 등) 빈 목록 — 미리보기만 안 뜨고 나머지는 그대로다.
 */
export function loadLinkPreviewManifest(manifestPath: string): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * 본문 링크에 data-preview-src 를 붙인다. PostContent 가 이 속성을 보고 hover 카드를 띄운다.
 * frontmatter 의 linkPreviews 가 있으면 manifest 보다 우선한다 —
 * 특정 링크만 직접 만든 이미지로 덮고 싶을 때 쓴다.
 */
export function linkPreviewPlugin(
  manifest: Record<string, string>,
  overrides: Record<string, string> | undefined,
) {
  const previewFor = (href: string): string | undefined => {
    if (href.startsWith("/")) return manifest[`${SITE_URL}${href}`];
    return manifest[href];
  };
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string") return;
      const src = overrides?.[href] ?? previewFor(href);
      if (!src) return;
      node.properties = { ...node.properties, dataPreviewSrc: src };
    });
  };
}
