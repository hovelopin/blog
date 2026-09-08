"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const STEP = 1400;
const DURATION = STEP * 5;

/** `const a = $.aidraft; a.service; return a.title;` 를 두 경우로 돌려본다. */
const ACCESSES = [".aidraft", ".service", ".title"];

function drawCase(
  { ctx, palette }: DrawArgs,
  x: number,
  w: number,
  title: string,
  revoking: boolean,
  step: number,
  local: number,
) {
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(title, x, 18);

  // 접근 기록
  const rowY = 44;
  const rowH = 22;
  ACCESSES.forEach((acc, i) => {
    const reached = i < step;
    const now = i === step;
    if (!reached && !now) return;
    const alpha = now ? Math.min(1, local * 2.2) : 1;
    // revoke 를 쓰면 세 번째 접근(a.title)에서 폐기된 프록시라 에러가 난다
    const errored = revoking && i === 2;
    const color = errored ? palette.danger : palette.primary;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(x, rowY + i * rowH, w, rowH - 4, 4);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.13;
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = errored ? palette.danger : palette.fg;
    ctx.fillText(
      errored ? `${acc} → TypeError (revoked)` : `a${acc}`,
      x + 8,
      rowY + i * rowH + (rowH - 4) / 2,
    );
    ctx.globalAlpha = 1;
  });

  // state 배열
  const stateY = rowY + ACCESSES.length * rowH + 16;
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("state", x, stateY);

  // revoke 가 없으면 세 키가 전부 쌓여 경로가 오염된다
  const keys = revoking
    ? ["aidraft"].slice(0, Math.min(1, step))
    : ["aidraft", "service", "title"].slice(0, step);
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(`[${keys.map((k) => `'${k}'`).join(", ")}]`, x + 42, stateY);

  // 결론
  const resultY = stateY + 26;
  ctx.font = `600 11px ${MONO}`;
  if (step >= ACCESSES.length) {
    if (revoking) {
      ctx.fillStyle = palette.primary;
      ctx.fillText("즉시 에러 — 잘못된 키가 만들어지지 않는다", x, resultY);
    } else {
      ctx.fillStyle = palette.danger;
      ctx.fillText("'aidraft.service.title' — 조용히 어긋난 키", x, resultY);
    }
  }
}

function draw(args: DrawArgs) {
  const { ctx, width, height, elapsed, palette } = args;
  const pad = 14;
  const gap = 22;
  const colW = (width - pad * 2 - gap) / 2;
  const step = Math.min(ACCESSES.length, Math.floor(elapsed / STEP));
  const local = (elapsed % STEP) / STEP;

  drawCase(args, pad, colW, "중간 Proxy 를 그대로 두면", false, step, local);
  drawCase(args, pad + colW + gap, colW, "접근할 때마다 revoke 하면", true, step, local);

  ctx.strokeStyle = palette.border;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(pad + colW + gap / 2, 12);
  ctx.lineTo(pad + colW + gap / 2, height - 12);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";
}

/** 중간 Proxy 를 재사용했을 때 경로가 어떻게 오염되는지 보여준다. */
export function RevokeDemo() {
  return (
    <CanvasDemo
      caption="a.service 를 한 번 읽고 a.title 을 부르면 어떻게 되는가"
      height={196}
      duration={DURATION}
      draw={draw}
    />
  );
}
