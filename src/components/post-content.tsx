"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface PostContentProps {
  html: string;
  className?: string;
}

const CARD_WIDTH = 248;
const CARD_HEIGHT = 160;
const GAP = 10;
const HIDE_DELAY = 120;

function enhanceCodeBlocks(root: HTMLElement): () => void {
  const disposers: Array<() => void> = [];
  const pres = root.querySelectorAll<HTMLPreElement>("pre");
  pres.forEach((pre) => {
    if (pre.dataset.enhanced === "1") return;
    pre.dataset.enhanced = "1";
    const code = pre.querySelector("code");
    const lang = code?.getAttribute("data-language") ?? "";
    const fig = pre.closest("figure[data-rehype-pretty-code-figure]");
    const hostForToolbar = fig ?? pre;

    const toolbar = document.createElement("div");
    toolbar.className = "code-toolbar";

    const label = document.createElement("span");
    label.className = "code-toolbar-lang";
    label.textContent = lang || "code";
    toolbar.appendChild(label);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-toolbar-copy";
    btn.setAttribute("aria-label", "copy code");
    btn.textContent = "copy";

    const onClick = async () => {
      const text = code?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "copied";
        btn.dataset.state = "ok";
        window.setTimeout(() => {
          btn.textContent = "copy";
          btn.removeAttribute("data-state");
        }, 1400);
      } catch {
        btn.textContent = "failed";
        window.setTimeout(() => {
          btn.textContent = "copy";
        }, 1400);
      }
    };
    btn.addEventListener("click", onClick);
    toolbar.appendChild(btn);

    if (hostForToolbar instanceof HTMLElement) {
      hostForToolbar.classList.add("has-toolbar");
      hostForToolbar.prepend(toolbar);
    }

    disposers.push(() => {
      btn.removeEventListener("click", onClick);
      toolbar.remove();
      if (hostForToolbar instanceof HTMLElement) {
        hostForToolbar.classList.remove("has-toolbar");
      }
      delete pre.dataset.enhanced;
    });
  });
  return () => disposers.forEach((d) => d());
}

export function PostContent({ html, className }: PostContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    return enhanceCodeBlocks(root);
  }, [html]);

  useEffect(() => {
    const root = containerRef.current;
    const tooltip = tooltipRef.current;
    const img = imgRef.current;
    if (!root || !tooltip || !img) return;

    let hideTimer: number | null = null;
    let currentSrc: string | null = null;

    const cancelHide = () => {
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const hideNow = () => {
      tooltip.style.opacity = "0";
      tooltip.style.transform = "translateX(-50%) translateY(-4px)";
      tooltip.setAttribute("aria-hidden", "true");
    };

    const scheduleHide = () => {
      cancelHide();
      hideTimer = window.setTimeout(hideNow, HIDE_DELAY);
    };

    const show = (anchor: HTMLAnchorElement) => {
      const src = anchor.dataset.previewSrc;
      if (!src) return;
      const alt = anchor.dataset.previewAlt ?? anchor.textContent ?? "";
      const rect = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const anchorCenter = rect.left + rect.width / 2;
      const half = CARD_WIDTH / 2;
      const left = Math.min(Math.max(anchorCenter, half + 8), vw - half - 8);
      let top = rect.bottom + GAP;
      if (top + CARD_HEIGHT > window.innerHeight - 8) {
        top = rect.top - GAP - CARD_HEIGHT;
      }
      cancelHide();
      if (currentSrc !== src) {
        img.src = src;
        img.alt = alt;
        currentSrc = src;
      }
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.opacity = "1";
      tooltip.style.transform = "translateX(-50%) translateY(0)";
      tooltip.setAttribute("aria-hidden", "false");
    };

    const findAnchor = (target: EventTarget | null) =>
      target instanceof Element
        ? (target.closest(
            "a[data-preview-src]",
          ) as HTMLAnchorElement | null)
        : null;

    const onOver = (e: MouseEvent) => {
      const anchor = findAnchor(e.target);
      if (!anchor) return;
      const related = e.relatedTarget as Node | null;
      if (related && anchor.contains(related)) return;
      show(anchor);
    };

    const onOut = (e: MouseEvent) => {
      const anchor = findAnchor(e.target);
      if (!anchor) return;
      const related = e.relatedTarget as Node | null;
      if (related && anchor.contains(related)) return;
      scheduleHide();
    };

    const onFocusIn = (e: FocusEvent) => {
      const anchor = findAnchor(e.target);
      if (anchor) show(anchor);
    };

    const onFocusOut = (e: FocusEvent) => {
      const anchor = findAnchor(e.target);
      if (anchor) scheduleHide();
    };

    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseout", onOut);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);

    return () => {
      cancelHide();
      root.removeEventListener("mouseover", onOver);
      root.removeEventListener("mouseout", onOut);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={cn("prose-blog", className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div
        ref={tooltipRef}
        role="tooltip"
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed z-40",
          "rounded-xl border border-border bg-card p-2",
          "shadow-[0_9px_24px_4px_rgba(0,0,0,0.45)]",
          "transition-[opacity,transform] duration-150 ease-out",
        )}
        style={{
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
          left: 0,
          top: 0,
          opacity: 0,
          transform: "translateX(-50%) translateY(-4px)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          alt=""
          className="h-full w-full rounded-lg border border-border/40 object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </>
  );
}
