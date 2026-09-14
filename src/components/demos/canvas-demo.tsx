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
  /** 좁은 화면이라 두 레인을 위아래로 쌓는 중인지 (stackable 데모만 true 가 된다) */
  stacked: boolean;
  /** 레인 하나가 쓸 수 있는 높이. 쌓이지 않았으면 height 와 같다. */
  laneH: number;
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
  /**
   * 두 레인을 나란히 그리는 데모. 켜면 좁은 화면에서 레인을 위아래로 쌓고
   * 캔버스 높이를 두 배로 늘린다(장면을 통째로 축소하지 않는다).
   */
  stackable?: boolean;
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
  stackable = false,
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

    // draw() 는 항상 이 폭 이상의 논리 좌표계를 받는다. 컨테이너가 더 좁으면
    // 장면을 이 폭으로 그린 뒤 transform 으로 통째로 축소한다. 그래서 17개 데모의
    // 레이아웃 코드를 하나도 안 고치고 모바일에서도 같은 구도가 나온다.
    const MIN_LOGICAL_WIDTH = 600;
    // 이 폭보다 좁으면 stackable 데모는 레인을 위아래로 쌓는다.
    const STACK_BREAKPOINT = 520;
    let logicalW = MIN_LOGICAL_WIDTH;
    let scale = 1;
    let stacked = false;
    let activeH = height;
    let lastElapsed = 0;

    const paint = (elapsed: number) => {
      lastElapsed = elapsed;
      ctx.clearRect(0, 0, logicalW, activeH);
      draw({ ctx, width: logicalW, height: activeH, elapsed, palette, stacked, laneH: height });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // clientWidth 는 패딩을 포함한다. 카드가 p-4 라서 그대로 쓰면 캔버스가
      // 콘텐츠 박스보다 32px 넓어지고 overflow-hidden 이 오른쪽을 잘라냈다.
      const ws = getComputedStyle(wrap);
      const w = wrap.clientWidth - parseFloat(ws.paddingLeft) - parseFloat(ws.paddingRight);
      stacked = stackable && w < STACK_BREAKPOINT;
      if (stacked) {
        // 쌓기: 축소 없이 실제 폭으로 그리고 높이를 두 배로 쓴다.
        logicalW = w;
        scale = 1;
        activeH = height * 2;
      } else {
        logicalW = Math.max(w, MIN_LOGICAL_WIDTH);
        scale = w / logicalW;
        activeH = height;
      }
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(activeH * scale * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${activeH * scale}px`;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      // canvas.width 대입은 캔버스를 비운다. 다음 프레임까지 빈 채로 두면
      // 리사이즈 중 깜빡이므로 같은 틱에 바로 다시 그린다.
      paint(lastElapsed);
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

    const ro = new ResizeObserver(() => resize());
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
  }, [height, duration, draw, stackable]);

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

interface TwoLanesOptions {
  /** 캔버스 좌우 여백 */
  pad: number;
  /** 나란히 놓일 때 두 레인 사이 간격 */
  gap: number;
  /** 두 레인 사이 구분선을 그릴지 */
  divider?: boolean;
}

type LanePainter = (x: number, w: number, laneH: number) => void;

/**
 * 두 레인을 배치한다. 넓으면 좌우로 나란히, 좁으면(stacked) 위아래로.
 *
 * 레인 콜백은 자기 왼쪽 x 와 폭, 그리고 쓸 수 있는 높이만 받는다.
 * 쌓일 때 두 번째 레인은 ctx.translate 로 내려 그리므로 레인 안의 y 좌표는
 * 나란히 놓일 때와 완전히 같다 — 데모 코드는 배치를 신경 쓰지 않아도 된다.
 */
export function twoLanes(
  args: DrawArgs,
  { pad, gap, divider = false }: TwoLanesOptions,
  first: LanePainter,
  second: LanePainter,
) {
  const { ctx, width, palette, stacked, laneH } = args;

  if (!stacked) {
    const colW = (width - pad * 2 - gap) / 2;
    first(pad, colW, laneH);
    second(pad + colW + gap, colW, laneH);
    if (divider) {
      const x = pad + colW + gap / 2;
      ctx.save();
      ctx.strokeStyle = palette.border;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x, laneH - 12);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  const colW = width - pad * 2;
  first(pad, colW, laneH);
  if (divider) {
    ctx.save();
    ctx.strokeStyle = palette.border;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(pad, laneH);
    ctx.lineTo(width - pad, laneH);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(0, laneH);
  second(pad, colW, laneH);
  ctx.restore();
}
