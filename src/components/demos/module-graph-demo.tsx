"use client";

import { CanvasDemo, twoLanes, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const DURATION = 6000;
/** 왕복 한 번에 해당하는 시간(ms). 실제 지연이 아니라 순서를 보여주기 위한 값. */
const RTT = 1100;

interface Req {
  name: string;
  depth: number;
  bytes: number;
}

/** serve.mjs --crawl 결과. depth 는 "몇 번째 왕복에서 알게 된 파일인가". */
const UNBUNDLED: Req[] = [
  { name: "main.js", depth: 0, bytes: 345 },
  { name: "index.js", depth: 1, bytes: 302 },
  { name: "format-date.js", depth: 2, bytes: 427 },
  { name: "slugify.js", depth: 2, bytes: 293 },
  { name: "clamp.js", depth: 2, bytes: 262 },
  { name: "debounce.js", depth: 2, bytes: 335 },
  { name: "deep-equal.js", depth: 2, bytes: 804 },
];
const BUNDLED: Req[] = [
  { name: "main-bundled.js", depth: 0, bytes: 209 },
  { name: "index.js (번들)", depth: 1, bytes: 2081 },
];
const MAX_BYTES = 2100;

function lane(
  { ctx, palette, elapsed }: DrawArgs,
  x: number,
  w: number,
  title: string,
  reqs: Req[],
  summary: string,
) {
  const rowH = 20;
  const top = 34;
  const labelW = Math.min(118, w * 0.4);
  const barLeft = x + labelW;
  const barMaxW = w - labelW - 4;
  const depths = Math.max(...reqs.map((r) => r.depth)) + 1;
  const colW = barMaxW / depths;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(title, x, 14);

  // 왕복 구분선
  for (let d = 1; d < depths; d++) {
    ctx.strokeStyle = palette.border;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(barLeft + colW * d, top - 8);
    ctx.lineTo(barLeft + colW * d, top + reqs.length * rowH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  reqs.forEach((r, i) => {
    const y = top + i * rowH + rowH / 2;
    const start = r.depth * RTT;
    const p = Math.max(0, Math.min(1, (elapsed - start) / 500));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText(r.name, x, y);
    // 막대 길이는 바이트, 시작 위치는 왕복 순서
    const bw = Math.max(3, (r.bytes / MAX_BYTES) * colW * 2.4 * p);
    ctx.fillStyle = r.depth === 0 ? palette.muted : palette.primary;
    ctx.globalAlpha = p * 0.85;
    ctx.beginPath();
    ctx.roundRect(
      barLeft + colW * r.depth + 2,
      y - 6,
      Math.min(bw, barMaxW - colW * r.depth - 4),
      12,
      2,
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  const done = elapsed > (depths - 1) * RTT + 600;
  if (done) {
    ctx.font = `600 10px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.fillText(summary, x, top + reqs.length * rowH + 14);
  }
  ctx.textBaseline = "alphabetic";
}

function draw(args: DrawArgs) {
  twoLanes(
    args,
    { pad: 14, gap: 28, divider: true },
    (x, w) => lane(args, x, w, "번들 없음", UNBUNDLED, "7 요청 · 2,768 B · 왕복 3번"),
    (x, w) => lane(args, x, w, "번들 1개", BUNDLED, "2 요청 · 2,290 B · 왕복 2번"),
  );
}

/** 파일을 그대로 내보낼 때와 하나로 합쳤을 때 브라우저가 겪는 요청 순서. */
export function ModuleGraphDemo() {
  return (
    <CanvasDemo
      caption="함수 하나를 쓰기 위해 브라우저가 보내는 요청 (세로선 = 왕복 경계)"
      height={200}
      duration={DURATION}
      draw={draw}
      stackable
    />
  );
}
