"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HorizontalScrollerProps {
  children: ReactNode;
  className?: string;
  /** Width in px scrolled per arrow click. Defaults to 340 (card width + gap). */
  step?: number;
}

export function HorizontalScroller({
  children,
  className,
  step = 340,
}: HorizontalScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanLeft(el.scrollLeft > 2);
      setCanRight(el.scrollLeft < max - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    resizeObserver?.observe(el);

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const next = el.scrollLeft + e.deltaY;
      if (
        (e.deltaY > 0 && el.scrollLeft < max) ||
        (e.deltaY < 0 && el.scrollLeft > 0)
      ) {
        e.preventDefault();
        el.scrollLeft = Math.max(0, Math.min(max, next));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      el.removeEventListener("wheel", onWheel);
      resizeObserver?.disconnect();
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6 pt-2 sm:px-6"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy(-1)}
        className={cn(
          "absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-md backdrop-blur-sm transition-all duration-200 sm:flex",
          "h-9 w-9 hover:border-border hover:bg-background hover:text-foreground",
          canLeft
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        className={cn(
          "absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-md backdrop-blur-sm transition-all duration-200 sm:flex",
          "h-9 w-9 hover:border-border hover:bg-background hover:text-foreground",
          canRight
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
