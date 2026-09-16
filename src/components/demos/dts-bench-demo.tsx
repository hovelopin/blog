"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const DURATION = 5200;
const GROW = 1500;

/** 생성 모듈 1,000개짜리 라이브러리에서 각 3회 잰 중앙값(ms). */
const BASELINE = 177;
const BARS = [
  { label: "tsc --emitDeclarationOnly", ms: 698, base: 0 },
  { label: "tsdown · generator: tsc", ms: 1655, base: BASELINE },
  { label: "tsdown · generator: oxc", ms: 1041, base: BASELINE },
  { label: "tsdown · dts 없음 (기준선)", ms: BASELINE, base: 0 },
  { label: "tsc --noEmit (검사만)", ms: 533, base: 0 },
];
const MAX = 1750;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function draw({ ctx, width, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const labelW = Math.min(214, width * 0.38);
  const barLeft = pad + labelW;
  const barMaxW = width - barLeft - pad - 60;
  const barH = 20;
  const gap = 14;
  const top = 16;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  BARS.forEach((bar, i) => {
    const y = top + i * (barH + gap);
    const t = easeOut(Math.max(0, Math.min(1, (elapsed - i * 140) / GROW)));
    const w = (bar.ms / MAX) * barMaxW * t;
    const baseW = (bar.base / MAX) * barMaxW * t;

    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText(bar.label, pad, y + barH / 2);

    ctx.fillStyle = palette.border;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.roundRect(barLeft, y, barMaxW, barH, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 전체 막대. tsdown 행은 기준선(JS 번들) 부분을 흐리게 깔아 d.ts 비용만 진하게 보이게 한다.
    ctx.fillStyle = palette.primary;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.roundRect(barLeft, y, Math.max(2, w), barH, 5);
    ctx.fill();
    if (bar.base > 0) {
      ctx.fillStyle = palette.card;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.roundRect(barLeft, y, Math.max(2, baseW), barH, 5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font = `600 12px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.fillText(`${Math.round(bar.ms * t).toLocaleString()} ms`, barLeft + w + 8, y + barH / 2);

    if (t >= 1 && bar.base > 0) {
      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = palette.muted;
      ctx.fillText(`d.ts ${(bar.ms - bar.base).toLocaleString()} ms`, barLeft + baseW + 6, y + barH / 2);
    }
  });

  ctx.textBaseline = "alphabetic";
}

/** d.ts 를 만드는 방법별 소요 시간. tsdown 행의 흐린 앞부분은 JS 번들에 든 시간이다. */
export function DtsBenchDemo() {
  return (
    <CanvasDemo
      caption="모듈 1,000개 라이브러리 · 각 3회 중앙값 (흐린 부분 = JS 번들 시간)"
      height={186}
      duration={DURATION}
      draw={draw}
    />
  );
}
