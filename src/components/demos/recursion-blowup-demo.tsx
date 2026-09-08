"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const DURATION = 7000;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const MAX_FRAMES = 9;

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const gap = 20;
  const colW = (width - pad * 2 - gap) / 2;
  const t = Math.min(1, elapsed / (DURATION * 0.9));

  // 수정 전: 프레임이 계속 쌓인다. 수정 후: 두 번째 진입에서 끊긴다.
  const beforeFrames = Math.min(MAX_FRAMES, Math.floor(t * (MAX_FRAMES + 2)));
  const afterFrames = Math.min(2, Math.floor(t * (MAX_FRAMES + 2)));
  const blocked = t * (MAX_FRAMES + 2) >= 2;

  const frameH = 16;
  const frameGap = 3;
  const stackTop = 46;

  const columns: [string, number, boolean][] = [
    ["수정 전 — 플래그를 new Map() 뒤에 설정", beforeFrames, false],
    ["수정 후 — 플래그를 먼저 설정", afterFrames, true],
  ];

  ctx.textBaseline = "middle";

  columns.forEach(([title, frames, safe], ci) => {
    const x = pad + ci * (colW + gap);
    const color = safe ? palette.primary : palette.danger;

    ctx.textAlign = "left";
    ctx.font = `600 11px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.fillText(title, x, 16);

    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText("call stack", x, 34);

    for (let i = 0; i < frames; i++) {
      const y = stackTop + i * (frameH + frameGap);
      if (y + frameH > height - 34) break;
      ctx.beginPath();
      ctx.roundRect(x, y, colW, frameH, 3);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.14;
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = palette.fg;
      ctx.fillText(`createMap(model)`, x + 6, y + frameH / 2);
    }

    // 상태 문구
    ctx.font = `600 10px ${MONO}`;
    if (safe && blocked) {
      ctx.fillStyle = palette.primary;
      ctx.fillText("$$consumed === true → throw", x, height - 20);
      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = palette.muted;
      ctx.fillText("2단계에서 사이클이 끊긴다", x, height - 8);
    } else if (!safe && frames >= MAX_FRAMES) {
      ctx.fillStyle = palette.danger;
      ctx.fillText("스택 한계까지 계속 쌓임 · CPU 100%", x, height - 20);
      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = palette.muted;
      ctx.fillText("$$consumed = true 에 영영 도달하지 못한다", x, height - 8);
    } else if (!safe) {
      ctx.fillStyle = palette.muted;
      ctx.fillText("new Map(model) → 이터레이터가 재진입", x, height - 20);
    }
  });

  // 가운데 구분선
  ctx.strokeStyle = palette.border;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(pad + colW + gap / 2, 12);
  ctx.lineTo(pad + colW + gap / 2, height - 30);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textBaseline = "alphabetic";
}

/** 소비 플래그 위치 한 줄 차이로 재귀가 끊기는지 아닌지를 보여준다. */
export function RecursionBlowupDemo() {
  return (
    <CanvasDemo
      caption="createMap 재진입 — 플래그를 언제 세우느냐에 따라 갈리는 콜 스택"
      height={252}
      duration={DURATION}
      draw={draw}
    />
  );
}
