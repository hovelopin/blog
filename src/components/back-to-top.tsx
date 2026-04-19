"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 400;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="scroll to top"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed z-50 inline-flex items-center border border-border bg-card/95 backdrop-blur-sm",
        "transition-[opacity,transform] duration-200 ease-out",
        "hover:border-primary/50 hover:bg-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        // Mobile: floating circular icon button, bottom-right
        "bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 h-11 w-11 justify-center rounded-full shadow-lg shadow-black/30",
        // Desktop: centered pill with text
        "sm:bottom-5 sm:left-1/2 sm:right-auto sm:h-9 sm:w-auto sm:-translate-x-1/2 sm:gap-2 sm:rounded-lg sm:px-3.5 sm:font-mono sm:text-[13px] sm:shadow-lg sm:shadow-black/40",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp
        size={18}
        aria-hidden="true"
        className="text-foreground sm:hidden"
      />
      <span className="hidden sm:inline text-primary">$</span>
      <span className="hidden sm:inline text-foreground">cd</span>
      <span className="hidden sm:inline text-amber-400">↑</span>
      <span className="hidden sm:inline text-amber-400">top</span>
    </button>
  );
}
