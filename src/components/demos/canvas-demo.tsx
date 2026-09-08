"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** 캔버스에 그릴 때 쓰는 팔레트. 페이지의 CSS 변수를 읽어 채우므로 테마를 그대로 따라간다. */
export interface DemoPalette {
  fg: string;
  muted: string;
  border: string;
  primary: string;
  card: string;
  warn: string;
  danger: string;
}

export interface DrawArgs {
  ctx: CanvasRenderingContext2D;
  /** CSS 픽셀 기준 크기 (DPR 보정은 이미 적용돼 있다) */
  width: number;
  height: number;
  /** 재생 시작 후 흐른 시간(ms) */
  elapsed: number;
  palette: DemoPalette;
}

interface CanvasDemoProps {
  /** 위쪽에 붙는 설명 라벨 */
  caption: string;
  /** 캔버스 높이(CSS 픽셀) */
  height: number;
  /** 한 바퀴 길이(ms). 지나면 0 부터 다시 시작한다. */
  duration: number;
  draw: (args: DrawArgs) => void;
  className?: string;
}

function readPalette(el: HTMLElement): DemoPalette {
  const s = getComputedStyle(el);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    fg: v("--foreground", "#1a1a1a"),
    muted: v("--muted-foreground", "#777"),
    border: v("--border", "#ddd"),
    primary: v("--primary", "#2f9e63"),
    card: v("--card", "#fff"),
    warn: "oklch(0.75 0.15 70)",
    danger: "oklch(0.62 0.2 25)",
  };
}

/**
 * 글 본문에 넣는 애니메이션 데모의 공통 껍데기.
 *
 * - 화면에 보일 때만 재생한다(IntersectionObserver).
 * - devicePixelRatio 를 반영해 레티나에서도 선명하게 그린다.
 * - 테마가 바뀌면 팔레트를 다시 읽는다.
 * - 동작 최소화를 켠 사용자에게는 애니메이션 대신 마지막 프레임만 보여준다.
 */
function CanvasDemoView({
  caption,
  height,
  duration,
  draw,
  className,
  onReplay,
}: CanvasDemoProps & { onReplay: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let palette = readPalette(wrap);
    let visible = false;
    let raf = 0;
    let start = 0;
    let pausedAt = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (elapsed: number) => {
      const w = wrap.clientWidth;
      ctx.clearRect(0, 0, w, height);
      draw({ ctx, width: w, height, elapsed, palette });
    };

    const frame = (now: number) => {
      if (!start) start = now;
      const elapsed = (now - start + pausedAt) % duration;
      paint(elapsed);
      raf = requestAnimationFrame(frame);
    };

    const play = () => {
      if (raf || reduceMotion) return;
      start = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    // 동작 최소화 설정에서는 애니메이션 없이 마지막 프레임만 그린다.
    if (reduceMotion) paint(duration - 1);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
        else stop();
      },
      { threshold: 0.15 },
    );
    io.observe(wrap);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) paint(duration - 1);
    });
    ro.observe(wrap);

    // 테마 토글에 맞춰 색을 다시 읽는다.
    const mo = new MutationObserver(() => {
      palette = readPalette(wrap);
      if (reduceMotion) paint(duration - 1);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [height, duration, draw]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "my-8 overflow-hidden rounded-xl border border-border/60 bg-card/40 p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-muted-foreground">{caption}</p>
        <button
          type="button"
          onClick={onReplay}
          className="shrink-0 rounded border border-border/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          replay
        </button>
      </div>
      <canvas ref={canvasRef} role="img" aria-label={caption} />
    </div>
  );
}

/**
 * 글 본문용 캔버스 데모.
 * replay 를 누르면 key 가 바뀌며 내부 뷰가 새로 마운트돼 처음부터 다시 재생된다.
 */
export function CanvasDemo(props: CanvasDemoProps) {
  const [runId, setRunId] = useState(0);
  return <CanvasDemoView key={runId} {...props} onReplay={() => setRunId((n) => n + 1)} />;
}
