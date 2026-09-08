"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/types/content";

interface DynamicIslandTOCProps {
  headings: Heading[];
}

export function DynamicIslandTOC({ headings }: DynamicIslandTOCProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const update = () => {
      const threshold = 120;
      let current = headings[0]?.id ?? null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - threshold <= 0) {
          current = h.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);

  // 읽고 있는 위치가 바뀌면 목록도 그 항목이 보이도록 따라간다.
  // (목록이 길면 활성 항목이 스크롤 영역 밖에 남아 "목차가 멈춘 것처럼" 보인다)
  useEffect(() => {
    if (!expanded || !activeId) return;
    const nav = navRef.current;
    const item = nav?.querySelector<HTMLElement>(`[data-heading-id="${activeId}"]`);
    if (!nav || !item) return;
    const navBox = nav.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    if (itemBox.top < navBox.top + 4) {
      nav.scrollTop += itemBox.top - navBox.top - 4;
    } else if (itemBox.bottom > navBox.bottom - 26) {
      // 아래쪽 페이드에 가리지 않도록 여유를 두고 맞춘다.
      nav.scrollTop += itemBox.bottom - navBox.bottom + 26;
    }
  }, [activeId, expanded]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const handleHeadingClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActiveId(id);
    setExpanded(false);
  };

  if (headings.length === 0) return null;

  const activeHeading = headings.find((h) => h.id === activeId) ?? headings[0];
  const circumference = 2 * Math.PI * 6;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed top-20 z-50 right-6 lg:right-10",
        "hidden md:block",
        "overflow-hidden text-white shadow-xl shadow-black/40",
        "transition-[width,height,border-radius,background-color,backdrop-filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded
          ? "w-[300px] rounded-2xl bg-black/70 backdrop-blur-xl"
          : "w-[240px] rounded-3xl bg-black",
      )}
      style={{ height: expanded ? "auto" : "32px" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? "collapse toc" : "expand toc"}
        className="flex h-8 w-full items-center gap-2 px-3"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          className="-rotate-90 flex-shrink-0"
          aria-hidden="true"
        >
          <circle
            cx="7"
            cy="7"
            r="6"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
          <circle
            cx="7"
            cy="7"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="text-primary transition-[stroke-dashoffset] duration-150"
          />
        </svg>
        <span className="flex-1 truncate text-left font-mono text-[12px] leading-none">
          {activeHeading?.text ?? "목차"}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "flex-shrink-0 text-white/70 transition-transform duration-300",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="relative overflow-hidden">
          <nav
            ref={navRef}
            className="toc-scroll max-h-[min(50vh,420px)] overflow-y-auto overscroll-contain px-2 pb-2 pt-1"
          >
            <ul className="flex flex-col">
              {headings.map((h) => {
                const isActive = h.id === activeId;
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      data-heading-id={h.id}
                      onClick={() => handleHeadingClick(h.id)}
                      className={cn(
                        "block w-full truncate rounded-lg py-1.5 text-left font-mono text-[13px] leading-tight transition-colors",
                        h.depth === 2 ? "pl-3" : "pl-6",
                        isActive ? "text-white" : "text-white/50 hover:text-white/80",
                      )}
                    >
                      {h.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          {/* 아래로 더 있다는 것을 보여주는 페이드 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
