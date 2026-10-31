import fs from "node:fs";
import path from "node:path";
import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import GithubSlugger from "github-slugger";
import type { Root as MdastRoot, Heading as MdastHeading } from "mdast";
import readingTime from "reading-time";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkFlexibleMarkers from "remark-flexible-markers";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { z } from "zod";
import { externalLinkPlugin } from "./src/lib/rehype-external-links";
import { linkPreviewPlugin, loadLinkPreviewManifest } from "./src/lib/rehype-link-previews";

/**
 * 콘텐츠 컬렉션. 원본은 저장소 루트의 content/ 를 그대로 읽는다.
 * remark/rehype 구성은 Next 시절 src/lib/mdx.ts 를 옮긴 것이라 결과 HTML 은 같다.
 *
 * - posts / postsEn : 글. `<slug>.mdx` 가 한국어, `<slug>.en.mdx` 가 영어판.
 * - books / chapters : research 책장. `<book>/book.mdx` 가 표지+서문, `<book>/NN-*.mdx` 가 챕터.
 * - diaryEntries     : 다이어리.
 */

const CONTENT_ROOT = "../../content";
const PUBLIC_DIR = path.resolve("public");

const previewManifest = loadLinkPreviewManifest(
  path.join(PUBLIC_DIR, "images", "link-previews", "manifest.json"),
);

type CompileContext = Parameters<typeof compileMDX>[0];
type CompileDocument = Parameters<typeof compileMDX>[1];

function compile(
  context: CompileContext,
  document: CompileDocument,
  linkPreviews?: Record<string, string>,
) {
  return compileMDX(context, document, {
    remarkPlugins: [remarkGfm, remarkCjkFriendly, remarkFlexibleMarkers],
    rehypePlugins: [
      rehypeSlug,
      linkPreviewPlugin(previewManifest, linkPreviews),
      externalLinkPlugin(),
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
  });
}

/** interface 가 아니라 type 이어야 content-collections 의 Serializable 제약(인덱스 시그니처)을 통과한다. */
export type Heading = {
  id: string;
  text: string;
  depth: 2 | 3;
};

/**
 * 본문에서 h2·h3 만 뽑아 목차를 만든다.
 * id 는 rehype-slug 와 같은 github-slugger 로 만들어 본문 heading 의 id 와 맞춘다.
 */
function extractHeadings(source: string): Heading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source) as MdastRoot;
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  visit(tree, "heading", (node: MdastHeading) => {
    if (node.depth !== 2 && node.depth !== 3) return;
    let text = "";
    visit(node, (child) => {
      if (child.type === "text" || child.type === "inlineCode") {
        text += (child as { value: string }).value;
      }
    });
    text = text.trim();
    if (!text) return;
    headings.push({ id: slugger.slug(text), text, depth: node.depth === 2 ? 2 : 3 });
  });
  return headings;
}

/**
 * frontmatter 의 cover 가 public/ 아래 실제로 없는 파일을 가리키는 경우가 있다.
 * 그대로 넘기면 목록에서 깨진 이미지가 뜨므로, 파일이 없으면 없는 셈 친다.
 * (외부 URL 은 확인할 수 없으니 그대로 통과)
 */
function resolveCover(cover?: string): string | undefined {
  if (!cover) return undefined;
  if (!cover.startsWith("/")) return cover;
  return fs.existsSync(path.join(PUBLIC_DIR, cover.slice(1))) ? cover : undefined;
}

/** 마크다운 문법을 걷어낸 첫 80자. 홈의 다이어리 로그 한 줄 미리보기에 쓴다. */
function excerpt(markdown: string, max = 80): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/==([^=]+)==/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

const postSchema = z.object({
  content: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  linkPreviews: z.record(z.string(), z.string()).optional(),
  series: z.string().optional(),
  seriesOrder: z.number().optional(),
  draft: z.boolean().optional(),
});

type PostDoc = z.infer<typeof postSchema> & CompileDocument;

async function transformPost(doc: PostDoc, context: CompileContext, slug: string) {
  const body = await compile(context, doc, doc.linkPreviews);
  const { content, ...frontmatter } = doc;
  return {
    ...frontmatter,
    slug,
    cover: resolveCover(doc.cover),
    readingTimeMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    headings: extractHeadings(content),
    body,
  };
}

const posts = defineCollection({
  name: "posts",
  directory: `${CONTENT_ROOT}/posts`,
  include: "*.mdx",
  exclude: "*.en.mdx",
  schema: postSchema,
  transform: (doc, context) => transformPost(doc, context, doc._meta.path),
});

const postsEn = defineCollection({
  name: "postsEn",
  directory: `${CONTENT_ROOT}/posts`,
  include: "*.en.mdx",
  schema: postSchema,
  transform: (doc, context) => transformPost(doc, context, doc._meta.path.replace(/\.en$/, "")),
});

const books = defineCollection({
  name: "books",
  directory: `${CONTENT_ROOT}/research`,
  include: "*/book.mdx",
  schema: z.object({
    content: z.string(),
    title: z.string(),
    repo: z.string().optional(),
    description: z.string(),
    date: z.string(),
    color: z.string().optional(),
    coverImage: z.string().optional(),
    sourceUrl: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
  transform: async (doc, context) => {
    const intro = doc.content.trim() ? await compile(context, doc) : "";
    const { content: _content, ...frontmatter } = doc;
    return {
      ...frontmatter,
      slug: doc._meta.directory,
      /** 서문. book.mdx 본문이 비어 있으면 빈 문자열. */
      intro,
    };
  },
});

const chapters = defineCollection({
  name: "chapters",
  directory: `${CONTENT_ROOT}/research`,
  include: "*/*.mdx",
  exclude: "*/book.mdx",
  schema: z.object({
    content: z.string(),
    title: z.string().optional(),
  }),
  transform: async (doc, context) => {
    const fileSlug = doc._meta.path.split("/").pop() ?? doc._meta.path;
    const orderMatch = fileSlug.match(/^(\d+)/);
    const body = await compile(context, doc);
    return {
      bookSlug: doc._meta.directory,
      slug: fileSlug,
      // "01-render-architecture" → "render architecture" 를 제목 대체용으로 쓴다.
      title:
        doc.title ??
        fileSlug
          .replace(/^\d+[-_]?/, "")
          .replace(/[-_]+/g, " ")
          .trim(),
      order: orderMatch ? Number.parseInt(orderMatch[1], 10) : Number.MAX_SAFE_INTEGER,
      headings: extractHeadings(doc.content),
      body,
    };
  },
});

const diaryEntries = defineCollection({
  name: "diaryEntries",
  directory: `${CONTENT_ROOT}/diary`,
  include: "*.mdx",
  schema: z.object({
    content: z.string(),
    // 날짜가 없는(아직 작성 중인) 항목은 lib/content.ts 에서 걸러낸다.
    date: z.string().optional(),
    mood: z.string().optional(),
  }),
  transform: async (doc, context) => {
    const body = await compile(context, doc);
    return {
      slug: doc._meta.path,
      date: doc.date,
      mood: doc.mood,
      excerpt: excerpt(doc.content),
      body,
    };
  },
});

export default defineConfig({
  content: [posts, postsEn, books, chapters, diaryEntries],
});
