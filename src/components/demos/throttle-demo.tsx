"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const DURATION = 8000;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
/** 데모 안에서 흐르는 가상 시간(ms) */
const SPAN = 4000;
/** 스크롤 이벤트 간격(ms) — 브라우저는 이보다 더 촘촘히 쏘기도 한다 */
const EVENT_EVERY = 60;
const THROTTLE_MS = 500;

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const w = width - pad * 2;
  const t = Math.min(1, elapsed / (DURATION * 0.95)) * SPAN;
  const px = (ms: number) => pad + (ms / SPAN) * w;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  // 1) 원본 scroll 이벤트
  const rawY = 40;
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("scroll 이벤트", pad, rawY - 18);

  ctx.strokeStyle = palette.border;
  ctx.beginPath();
  ctx.moveTo(pad, rawY);
  ctx.lineTo(pad + w, rawY);
  ctx.stroke();

  let rawCount = 0;
  for (let ms = 0; ms <= t; ms += EVENT_EVERY) {
    rawCount += 1;
    const x = px(ms);
    ctx.beginPath();
    ctx.moveTo(x, rawY - 7);
    ctx.lineTo(x, rawY + 7);
    ctx.strokeStyle = palette.danger;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 2) throttle 을 통과한 실행
  const thrY = rawY + 62;
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(`throttle ${THROTTLE_MS}ms 를 통과한 실행`, pad, thrY - 18);

  ctx.strokeStyle = palette.border;
  ctx.beginPath();
  ctx.moveTo(pad, thrY);
  ctx.lineTo(pad + w, thrY);
  ctx.stroke();

  let thrCount = 0;
  for (let ms = 0; ms <= t; ms += THROTTLE_MS) {
    thrCount += 1;
    const x = px(ms);
    ctx.beginPath();
    ctx.arc(x, thrY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = palette.primary;
    ctx.fill();
  }

  // 3) 누적 카운터 비교
  const barY = thrY + 40;
  const label = (text: string, n: number, color: string, y: number) => {
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText(text, pad, y);
    const maxBar = w - 190;
    const ratio = Math.min(1, n / Math.max(1, rawCount));
    ctx.beginPath();
    ctx.roundRect(pad + 150, y - 7, Math.max(2, maxBar * ratio), 14, 3);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.75;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `600 11px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.fillText(`${n}회`, pad + 150 + maxBar * ratio + 8, y);
  };

  label("핸들러 호출", rawCount, palette.danger, barY);
  label("setState 실행", thrCount, palette.primary, barY + 24);

  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(
    `같은 4초 동안 리렌더가 ${rawCount}번에서 ${thrCount}번으로 줄어든다`,
    pad,
    height - 12,
  );

  ctx.textBaseline = "alphabetic";
}

/** 스크롤 이벤트가 쏟아질 때 throttle 이 리렌더 횟수를 얼마나 줄이는지 보여준다. */
export function ThrottleDemo() {
  return (
    <CanvasDemo
      caption="scroll 이벤트 원본과 throttle 500ms 를 통과한 실행 횟수"
      height={214}
      duration={DURATION}
      draw={draw}
    />
  );
}
