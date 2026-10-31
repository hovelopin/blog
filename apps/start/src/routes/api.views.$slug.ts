import { createFileRoute } from "@tanstack/react-router";

/** 실제로 있는 글의 슬러그. 글은 배포할 때만 바뀌니 인스턴스가 사는 동안 한 번만 만든다. */
let knownSlugs: Promise<Set<string>> | null = null;

function getKnownSlugs(): Promise<Set<string>> {
  knownSlugs ??= import("@/lib/content").then(
    (c) => new Set(c.getAllPostSummaries().map((p) => p.slug)),
  );
  return knownSlugs;
}

/**
 * 글 조회를 기록하고 최신 조회수를 돌려준다.
 *
 * 조회수를 못 셀 때(설정 없음, 없는 글, Redis 장애)는 에러 대신
 * `views: null` 을 준다. 화면에서는 숫자를 숨기기만 하면 된다.
 * 이 라우트만 런타임 서버 함수로 돈다. 나머지 페이지는 전부 정적이다.
 */
export const Route = createFileRoute("/api/views/$slug")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { isViewCountEnabled, recordView } = await import("@/lib/views");
        if (!isViewCountEnabled()) return Response.json({ views: null });

        // 실제 글만 센다. 없는 슬러그로 Redis 키가 무한히 늘어나는 걸 막는다.
        const slugs = await getKnownSlugs();
        if (!slugs.has(params.slug)) return Response.json({ views: null }, { status: 404 });

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const userAgent = request.headers.get("user-agent") ?? "unknown";

        try {
          return Response.json({ views: await recordView(params.slug, ip, userAgent) });
        } catch {
          // Redis 가 죽어도 글은 읽을 수 있어야 한다.
          return Response.json({ views: null });
        }
      },
    },
  },
});
