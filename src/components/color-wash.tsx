"use client";

import { useEffect, useState } from "react";

/**
 * 새로고침 때 한 번 지나가는 색 번짐 오버레이. 스타일은 globals.css 의 `.color-wash`.
 *
 * 애니메이션이 끝나면 요소를 치운다. body 배경 애니메이션이 `body:has(.color-wash)` 에
 * 걸려 있어서, 요소가 남아 있으면 나중에 테마를 다크로 바꿀 때 또 돌기 때문이다.
 */
export function ColorWash() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;
  return <div className="color-wash" aria-hidden="true" />;
}
