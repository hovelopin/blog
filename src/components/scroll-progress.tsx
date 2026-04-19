"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? h.scrollTop / total : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, pct))})`;
    };
    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };

    schedule();
    const t1 = window.setTimeout(schedule, 0);
    const t2 = window.setTimeout(schedule, 120);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(document.body);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObserver?.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-primary/90"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
