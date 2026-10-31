import { useEffect } from "react";

/**
 * 브라우저에서 `<blog-demo>` 를 정의하고 리모트의 데모 렌더러를 등록한다.
 * 루트 레이아웃에 한 번만 두면 모든 페이지의 `<blog-demo>` 가 채워진다.
 * 리모트가 죽어 있어도 글은 그대로 보여야 하므로 실패는 삼키고 자리만 비워 둔다.
 */
export function DemoBootstrap() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ defineBlogDemo }] = await Promise.all([
          import("@blog/ui"),
          import("demos/register"),
        ]);
        if (!cancelled) defineBlogDemo();
      } catch (error) {
        if (!cancelled) console.warn("[blog-demo] 리모트를 불러오지 못했다", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
