"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const STEP = 1500;
const KEYS = ["pages", "notFound", "title"];
// 마지막에 완성된 문자열 키를 보여주는 구간을 하나 더 둔다.
const DURATION = STEP * (KEYS.length + 1);

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const step = Math.min(Math.floor(elapsed / STEP), KEYS.length);
  const local = (elapsed % STEP) / STEP;

  const pad = 14;
  const boxW = Math.min(112, (width - pad * 2 - 3 * 26) / 4);
  const boxH = 34;
  const gap = (width - pad * 2 - boxW * 4) / 3;
  const chainY = 30;

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // 1행 — $ 에서 시작해 프로퍼티를 타고 내려가는 Proxy 체인
  const labels = ["$", ...KEYS.map((k) => `P${KEYS.indexOf(k) + 1}`)];
  for (let i = 0; i < 4; i++) {
    const x = pad + i * (boxW + gap);
    const revoked = i > 0 && i < step; // 지나간 중간 Proxy 는 폐기된다
    const active = i <= step;
    const appearing = i === step && i > 0;
    const alpha = active ? (appearing ? easeOut(Math.min(1, local * 2.2)) : 1) : 0.18;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(x, chainY, boxW, boxH, 7);
    ctx.fillStyle = revoked ? palette.card : palette.primary;
    ctx.globalAlpha = revoked ? alpha * 0.25 : alpha * (active ? 0.16 : 0.08);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;
    ctx.strokeStyle = revoked ? palette.border : palette.primary;
    ctx.stroke();

    ctx.font = `600 13px ${MONO}`;
    ctx.fillStyle = revoked ? palette.muted : palette.fg;
    ctx.fillText(labels[i], x + boxW / 2, chainY + boxH / 2);

    if (revoked) {
      // 폐기된 Proxy 에는 사선을 긋는다.
      ctx.strokeStyle = palette.danger;
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, chainY + boxH - 8);
      ctx.lineTo(x + boxW - 8, chainY + 8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 화살표 + 접근한 키 이름
    if (i < 3) {
      const ax = x + boxW;
      const aw = gap;
      const shown = i < step ? 1 : i === step ? easeOut(Math.min(1, local * 1.8)) : 0;
      if (shown > 0) {
        ctx.globalAlpha = shown;
        ctx.strokeStyle = palette.muted;
        ctx.beginPath();
        ctx.moveTo(ax + 4, chainY + boxH / 2);
        ctx.lineTo(ax + aw * shown - 4, chainY + boxH / 2);
        ctx.stroke();
        ctx.font = `11px ${MONO}`;
        ctx.fillStyle = palette.primary;
        ctx.fillText(`.${KEYS[i]}`, ax + aw / 2, chainY - 10);
        ctx.globalAlpha = 1;
      }
    }
  }

  // 2행 — get 트랩이 state 배열에 키를 밀어 넣는 모습
  const stateY = chainY + boxH + 42;
  ctx.textAlign = "left";
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("state (체인 전체가 공유하는 배열)", pad, stateY - 14);

  const cellW = 118;
  const cellH = 30;
  for (let i = 0; i < KEYS.length; i++) {
    const filled = i < step;
    const filling = i === step && step < KEYS.length;
    const x = pad + i * (cellW + 8);
    const pop = filling ? easeOut(Math.min(1, local * 2)) : filled ? 1 : 0;
    if (pop === 0) continue;

    ctx.globalAlpha = pop;
    ctx.beginPath();
    ctx.roundRect(x, stateY - (1 - pop) * 6, cellW, cellH, 6);
    ctx.fillStyle = palette.primary;
    ctx.globalAlpha = pop * 0.14;
    ctx.fill();
    ctx.globalAlpha = pop;
    ctx.strokeStyle = palette.primary;
    ctx.stroke();
    ctx.font = `12px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.textAlign = "center";
    ctx.fillText(`'${KEYS[i]}'`, x + cellW / 2, stateY + cellH / 2 - (1 - pop) * 6);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  // 3행 — 마지막에 문자열 키로 합쳐진다
  const outY = stateY + cellH + 34;
  const done = step >= KEYS.length;
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("PATH_KEY 로 회수 → keySeparator 로 결합", pad, outY - 12);

  ctx.font = `600 14px ${MONO}`;
  if (done) {
    ctx.globalAlpha = easeOut(Math.min(1, local * 2));
    ctx.fillStyle = palette.primary;
    ctx.fillText("'pages.notFound.title'", pad, outY + 12);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = palette.border;
    ctx.fillText("…", pad, outY + 12);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  void height;
}

/** t($ => $.pages.notFound.title) 가 문자열 키로 바뀌는 과정을 단계별로 보여준다. */
export function ProxyPathDemo() {
  return (
    <CanvasDemo
      caption="$.pages.notFound.title — get 트랩이 경로를 쌓아가는 과정"
      height={196}
      duration={DURATION}
      draw={draw}
    />
  );
}
