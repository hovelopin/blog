import remarkGfm from "remark-gfm";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkFlexibleMarkers from "remark-flexible-markers";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

/**
 * frontmatter 의 linkPreviews 에 등록된 링크에 data-preview-src 를 붙인다.
 * PostContent 가 이 속성을 보고 hover 카드를 띄운다.
 */
function linkPreviewPlugin(map: Record<string, string> | undefined) {
  return () => (tree: Root) => {
    if (!map || Object.keys(map).length === 0) return;
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string") return;
      const src = map[href];
      if (!src) return;
      node.properties = { ...node.properties, dataPreviewSrc: src };
    });
  };
}

type MdxOptions = NonNullable<MDXRemoteProps["options"]>;

/**
 * 글·챕터·다이어리가 공유하는 MDX 컴파일 옵션.
 * 마크다운 시절의 remark/rehype 구성을 그대로 옮긴 것이라 결과 HTML 은 동일하다.
 */
export function mdxOptions(linkPreviews?: Record<string, string>): MdxOptions {
  return {
    parseFrontmatter: false,
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkCjkFriendly, remarkFlexibleMarkers],
      rehypePlugins: [
        rehypeSlug,
        linkPreviewPlugin(linkPreviews),
        [
          rehypePrettyCode,
          {
            theme: "github-dark-dimmed",
            keepBackground: false,
            // 언어를 적지 않은 블록도 figure 로 감싸지게 해서
            // js/ts 블록과 툴바·테두리 구조를 똑같이 맞춘다.
            defaultLang: "plaintext",
          },
        ],
      ],
    },
  };
}
