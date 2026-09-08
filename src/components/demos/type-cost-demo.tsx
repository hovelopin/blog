"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const DURATION = 4200;
const GROW = 1600;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** 리프 키 7,776개 리소스에 t() 호출 50개를 두고 tsc --noEmit 을 잰 결과. */
const BARS = [
  { label: "문자열 (enableSelector 없음)", ms: 1067, factor: "1.0×" },
  { label: "enableSelector: true", ms: 564, factor: "1.9×" },
  { label: "enableSelector: 'optimize'", ms: 302, factor: "3.5×" },
];
const MAX_MS = 1200;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function draw({ ctx, width, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const labelW = Math.min(220, width * 0.42);
  const barLeft = pad + labelW;
  const barMaxW = width - barLeft - pad - 52;
  const barH = 26;
  const gap = 22;
  const top = 22;

  ctx.textBaseline = "middle";

  BARS.forEach((bar, i) => {
    const y = top + i * (barH + gap);
    // 막대마다 조금씩 늦게 자라나게 한다.
    const delay = i * 180;
    const t = Math.max(0, Math.min(1, (elapsed - delay) / GROW));
    const grow = easeOut(t);
    const w = (bar.ms / MAX_MS) * barMaxW * grow;

    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "left";
    ctx.fillText(bar.label, pad, y + barH / 2);

    // 트랙
    ctx.fillStyle = palette.border;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.roundRect(barLeft, y, barMaxW, barH, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 값
    ctx.fillStyle = i === 0 ? palette.muted : palette.primary;
    ctx.globalAlpha = i === 0 ? 0.75 : 0.9;
    ctx.beginPath();
    ctx.roundRect(barLeft, y, Math.max(2, w), barH, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.font = `600 12px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.fillText(`${Math.round(bar.ms * grow)} ms`, barLeft + w + 8, y + barH / 2);

    if (t >= 1) {
      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = palette.muted;
      ctx.textAlign = "right";
      ctx.fillText(bar.factor, barLeft + barMaxW - 6, y - 9);
      ctx.textAlign = "left";
    }
  });

  ctx.textBaseline = "alphabetic";
}

/** 세 설정의 타입 계산 시간을 막대로 비교한다. */
export function TypeCostDemo() {
  return (
    <CanvasDemo
      caption="리프 키 7,776개 · t() 호출 50개 — tsc --noEmit 소요 시간"
      height={168}
      duration={DURATION}
      draw={draw}
    />
  );
}
