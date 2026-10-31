import { MDXContent } from "@content-collections/mdx/react";
import { mdxComponents } from "@/components/mdx-components";

interface MdxContentProps {
  /** content-collections 의 compileMDX 결과 */
  code: string;
}

/**
 * 글 본문(MDX)을 렌더한다.
 * 컴파일은 빌드 때 끝나 있고, 여기서는 그 결과를 실행만 한다.
 * 본문의 데모 태그는 mdxComponents 가 `<blog-demo>` 로 바꿔 리모트에 맡긴다.
 */
export function MdxContent({ code }: MdxContentProps) {
  return <MDXContent code={code} components={mdxComponents} />;
}
