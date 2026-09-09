"use client";

import { useEffect, useState } from "react";

interface ViewCountProps {
  slug: string;
}

/** 어느 글의 숫자인지 함께 들고 있어야 이전 글 값을 잘못 그리지 않는다. */
interface ViewState {
  slug: string;
  views: number | null;
}

/**
 * 글 조회수. 마운트할 때 한 번 기록하고 최신 값을 받아 보여준다.
 *
 * 글 페이지를 정적으로 두려고 서버가 아니라 여기서 가져온다.
 * 숫자를 못 받거나 0 이면 아무것도 그리지 않는다 —
 * 갓 쓴 글에 "0 views" 가 붙어 있으면 없느니만 못하다.
 */
export function ViewCount({ slug }: ViewCountProps) {
  const [state, setState] = useState<ViewState | null>(null);

  useEffect(() => {
    // 요청이 두 번 나가도 조회수는 서버에서 걸러진다(같은 방문자는 한 번만).
    // 그래서 중복 호출을 막기보다, 늦게 온 응답을 버리는 쪽으로만 처리한다.
    const controller = new AbortController();
    fetch(`/api/views/${encodeURIComponent(slug)}`, {
      method: "POST",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { views: number | null } | null) =>
        setState({ slug, views: data?.views ?? null }),
      )
      .catch(() => {
        // 조회수는 부가 정보다. 실패해도 조용히 넘어간다.
      });

    return () => controller.abort();
  }, [slug]);

  // 지금 글의 숫자일 때만 쓴다. 글이 바뀐 직후에는 아직 없는 셈이 된다.
  const views = state?.slug === slug ? state.views : null;
  if (views === null || views === 0) return null;

  return (
    <>
      <span aria-hidden="true">·</span>
      {/* 옆의 "5 min read" 와 같은 형식으로 맞춘다. */}
      <span>
        {views.toLocaleString("en-US")} view{views === 1 ? "" : "s"}
      </span>
    </>
  );
}
