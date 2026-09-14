import fs from "node:fs";
import path from "node:path";
import { SITE_URL } from "@/lib/site";

/**
 * 링크 미리보기 스크린샷 목록.
 *
 * `scripts/capture-link-previews.mjs` 가 빌드 전에 만들어 둔 manifest 를 읽는다.
 * 파일이 없으면(스크립트를 아직 안 돌린 로컬 등) 빈 목록으로 동작한다 —
 * 미리보기만 안 뜨고 나머지는 그대로다.
 */
const MANIFEST_PATH = path.join(
  process.cwd(),
  "public",
  "images",
  "link-previews",
  "manifest.json",
);

function load(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

const manifest = load();

/**
 * 본문 링크에 대응하는 스크린샷 경로. 없으면 undefined.
 * 내부 링크는 manifest 에 절대 URL 로 들어 있어서 앞에 사이트 주소를 붙여 찾는다.
 */
export function previewFor(href: string): string | undefined {
  if (href.startsWith("/")) return manifest[`${SITE_URL}${href}`];
  return manifest[href];
}
