"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const DURATION = 8000;

interface Req {
  label: string;
  ms: number;
  hit: boolean;
}

/** 첫 요청은 서버가 변환까지 하고, 이후에는 캐시가 받아친다. */
const REQUESTS: Req[] = [
  { label: "첫 요청 — 원본 내려받고 리사이즈", ms: 820, hit: false },
  { label: "두 번째 요청 — 캐시 HIT", ms: 0, hit: true },
  { label: "세 번째 요청 — 캐시 HIT", ms: 0, hit: true },
  { label: "캐시 만료 후 — 다시 변환", ms: 780, hit: false },
];

const MAX_MS = 900;
const SLOT = DURATION / REQUESTS.length;

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const labelW = Math.min(230, width * 0.44);
  const barLeft = pad + labelW;
  const barMaxW = width - barLeft - pad - 56;
  const rowH = 34;
  const top = 26;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  REQUESTS.forEach((r, i) => {
    const y = top + i * rowH;
    const start = i * SLOT;
    const p = Math.max(0, Math.min(1, (elapsed - start) / (SLOT * 0.7)));
    if (p <= 0) return;

    const color = r.hit ? palette.primary : palette.warn;
    ctx.globalAlpha = Math.min(1, p * 3);
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText(r.label, pad, y);

    // 응답 시간 막대 (캐시 HIT 는 거의 0)
    const w = Math.max(3, (r.ms / MAX_MS) * barMaxW * p);
    ctx.beginPath();
    ctx.roundRect(barLeft, y - 8, w, 16, 3);
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.min(1, p * 3) * 0.85;
    ctx.fill();
    ctx.globalAlpha = Math.min(1, p * 3);

    ctx.font = `600 11px ${MONO}`;
    ctx.fillStyle = r.hit ? palette.primary : palette.fg;
    ctx.fillText(r.hit ? "0 ms" : `${Math.round(r.ms * p)} ms`, barLeft + w + 8, y);
    ctx.globalAlpha = 1;
  });

  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("응답은 빨라지지만, 그 캐시는 서버가 계속 들고 있다", pad, height - 12);

  ctx.textBaseline = "alphabetic";
}

/** 캐시가 응답 시간을 어떻게 바꾸는지, 그리고 그 대가가 무엇인지 보여준다. */
export function CacheHitDemo() {
  return (
    <CanvasDemo
      caption="같은 이미지를 네 번 요청했을 때의 응답 시간"
      height={186}
      duration={DURATION}
      draw={draw}
    />
  );
}
