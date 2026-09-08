"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const STEP = 1600;
const DURATION = STEP * 4;

interface Branch {
  cond: string;
  timer: string;
  result: string;
  safe: boolean;
}

const BRANCHES: [Branch, Branch] = [
  {
    cond: "gcTime === Infinity (server default)",
    timer: "setTimeout 을 걸지 않는다",
    result: "요청이 끝나면 QueryClient 째로 버려진다",
    safe: true,
  },
  {
    cond: "gcTime = 24h (직접 지정)",
    timer: "setTimeout(24h) 등록",
    result: "타이머가 캐시를 붙잡은 채 요청마다 쌓인다",
    safe: false,
  },
];

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const step = Math.min(3, Math.floor(elapsed / STEP));
  const local = (elapsed % STEP) / STEP;

  ctx.textBaseline = "middle";

  // 분기 조건
  ctx.textAlign = "center";
  const condW = Math.min(300, width - pad * 2);
  const condX = (width - condW) / 2;
  ctx.beginPath();
  ctx.roundRect(condX, 20, condW, 32, 6);
  ctx.fillStyle = palette.muted;
  ctx.globalAlpha = 0.12;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.border;
  ctx.stroke();
  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText("gcTime 값을 확인한다", width / 2, 36);

  // 두 갈래
  const colW = (width - pad * 2 - 20) / 2;
  const topY = 78;
  BRANCHES.forEach((b, i) => {
    const x = pad + i * (colW + 20);
    const color = b.safe ? palette.primary : palette.danger;
    const rows: [string, number][] = [
      [b.cond, 1],
      [b.timer, 2],
      [b.result, 3],
    ];

    // 분기선
    ctx.strokeStyle = step >= 1 ? color : palette.border;
    ctx.globalAlpha = step >= 1 ? 0.6 : 0.3;
    ctx.beginPath();
    ctx.moveTo(width / 2, 54);
    ctx.lineTo(x + colW / 2, topY - 6);
    ctx.stroke();
    ctx.globalAlpha = 1;

    rows.forEach(([text, at], ri) => {
      const shown = step >= at;
      const now = step === at;
      if (!shown) return;
      const alpha = now ? Math.min(1, local * 2.2) : 1;
      const y = topY + ri * 42;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.roundRect(x, y, colW, 32, 5);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * (ri === 2 ? 0.18 : 0.1);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.stroke();

      ctx.font = ri === 0 ? `600 10px ${MONO}` : `10px ${MONO}`;
      ctx.fillStyle = ri === 2 ? color : palette.fg;
      ctx.textAlign = "center";
      // 긴 문장은 두 줄로 접는다
      const maxW = colW - 14;
      const words = text.split(" ");
      let line = "";
      const lines: string[] = [];
      for (const wd of words) {
        const test = line ? `${line} ${wd}` : wd;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line);
          line = wd;
        } else {
          line = test;
        }
      }
      lines.push(line);
      lines.slice(0, 2).forEach((ln, li) => {
        ctx.fillText(ln, x + colW / 2, y + 16 + (li - (lines.length - 1) / 2) * 12);
      });
      ctx.globalAlpha = 1;
    });
  });

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  void height;
}

/** SSR 에서 gcTime 값에 따라 타이머가 등록되는지 갈리는 분기. */
export function GcBranchDemo() {
  return (
    <CanvasDemo
      caption="같은 코드가 gcTime 값 하나로 갈라지는 지점"
      height={222}
      duration={DURATION}
      draw={draw}
    />
  );
}
