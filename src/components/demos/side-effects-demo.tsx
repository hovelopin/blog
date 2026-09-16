"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const DURATION = 4600;
const GROW = 1400;

/** lib 의 sideEffects 설정만 바꿔가며 잰 소비자 번들 (import { a } 하나). */
const BARS = [
  { label: "미설정", bytes: 646, registry: true },
  { label: "false", bytes: 160, registry: false },
  { label: '["register.js"]', bytes: 164, registry: false },
  { label: '["register.js", "index.js"]', bytes: 340, registry: true },
];
const MAX = 700;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function draw({ ctx, width, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const labelW = Math.min(196, width * 0.36);
  const barLeft = pad + labelW;
  const badgeW = 96;
  const barMaxW = width - barLeft - pad - badgeW - 52;
  const barH = 22;
  const gap = 16;
  const top = 18;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  BARS.forEach((bar, i) => {
    const y = top + i * (barH + gap);
    const t = easeOut(Math.max(0, Math.min(1, (elapsed - i * 160) / GROW)));
    const w = (bar.bytes / MAX) * barMaxW * t;

    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText(bar.label, pad, y + barH / 2);

    ctx.fillStyle = palette.border;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.roundRect(barLeft, y, barMaxW, barH, 5);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = bar.registry ? palette.primary : palette.danger;
    ctx.beginPath();
    ctx.roundRect(barLeft, y, Math.max(2, w), barH, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.font = `600 12px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.fillText(`${Math.round(bar.bytes * t)} B`, barLeft + w + 8, y + barH / 2);

    if (t >= 1) {
      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = bar.registry ? palette.primary : palette.danger;
      ctx.textAlign = "right";
      ctx.fillText(bar.registry ? "등록 코드 남음" : "등록 코드 사라짐", width - pad, y + barH / 2);
      ctx.textAlign = "left";
    }
  });

  ctx.textBaseline = "alphabetic";
}

/** sideEffects 값에 따라 소비자 번들 크기와 부작용 보존 여부가 어떻게 갈리는지. */
export function SideEffectsDemo() {
  return (
    <CanvasDemo
      caption="lib 의 sideEffects 값별 소비자 번들 (import { a } 하나)"
      height={170}
      duration={DURATION}
      draw={draw}
    />
  );
}
