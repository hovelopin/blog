import type { NextRequest } from "next/server";
import { getAllPostSlugs } from "@/lib/content";
import { isViewCountEnabled, recordView } from "@/lib/views";

/**
 * 실제로 있는 글의 슬러그 목록.
 * 글은 배포할 때만 바뀌니 인스턴스가 사는 동안 한 번만 읽는다.
 */
let knownSlugs: Promise<Set<string>> | null = null;

function getKnownSlugs(): Promise<Set<string>> {
  knownSlugs ??= getAllPostSlugs().then((slugs) => new Set(slugs));
  return knownSlugs;
}

/**
 * 글 조회를 기록하고 최신 조회수를 돌려준다.
 *
 * 조회수를 못 셀 때(설정 없음, 없는 글, Redis 장애)는 에러 대신
 * `views: null` 을 준다. 화면에서는 숫자를 숨기기만 하면 된다.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/views/[slug]">) {
  if (!isViewCountEnabled()) return Response.json({ views: null });

  const { slug } = await ctx.params;

  // 실제 글만 센다. 없는 슬러그로 Redis 키가 무한히 늘어나는 걸 막는다.
  const slugs = await getKnownSlugs();
  if (!slugs.has(slug)) return Response.json({ views: null }, { status: 404 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  try {
    return Response.json({ views: await recordView(slug, ip, userAgent) });
  } catch {
    // Redis 가 죽어도 글은 읽을 수 있어야 한다.
    return Response.json({ views: null });
  }
}
