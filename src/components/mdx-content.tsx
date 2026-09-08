import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxOptions } from "@/lib/mdx";
import { mdxComponents } from "@/components/mdx-components";

interface MdxContentProps {
  source: string;
  linkPreviews?: Record<string, string>;
}

/**
 * 글 본문(MDX)을 렌더한다.
 * 서버 컴포넌트라 빌드 타임에 컴파일되고, 클라이언트로는 결과 HTML 만 나간다.
 * 본문에서 쓰는 데모 컴포넌트는 mdxComponents 로 주입해 import 없이 쓸 수 있게 한다.
 */
export function MdxContent({ source, linkPreviews }: MdxContentProps) {
  return (
    <MDXRemote source={source} options={mdxOptions(linkPreviews)} components={mdxComponents} />
  );
}
