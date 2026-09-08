"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const STEP = 1600;
const DURATION = STEP * 4;

const OBJECTS = ["req.body", "config", "res.locals"];

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const step = Math.min(3, Math.floor(elapsed / STEP));
  const local = (elapsed % STEP) / STEP;

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // 위 — Object.prototype
  const protoW = Math.min(280, width - pad * 2);
  const protoX = (width - protoW) / 2;
  const protoY = 30;
  const polluted = step >= 1;

  ctx.beginPath();
  ctx.roundRect(protoX, protoY, protoW, 38, 6);
  ctx.fillStyle = polluted ? palette.danger : palette.muted;
  ctx.globalAlpha = polluted ? 0.18 : 0.1;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = polluted ? palette.danger : palette.border;
  ctx.stroke();

  ctx.font = `600 12px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText("Object.prototype", width / 2, protoY + 14);
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = polluted ? palette.danger : palette.muted;
  ctx.fillText(polluted ? "+ 공격자가 심은 프로퍼티" : "깨끗한 상태", width / 2, protoY + 29);

  // 페이로드가 위로 올라가는 표시
  if (step === 0) {
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.danger;
    ctx.globalAlpha = Math.min(1, local * 2);
    ctx.fillText("조작된 JSON 이 __proto__ 를 건드린다", width / 2, protoY + 58);
    ctx.globalAlpha = 1;
  }

  // 아래 — 프로토타입을 물려받는 객체들
  const objY = protoY + 86;
  const objW = (width - pad * 2 - 24) / OBJECTS.length;
  OBJECTS.forEach((name, i) => {
    const x = pad + i * (objW + 12);
    const infected = polluted && step - 1 > i - 1 && step >= 2;
    const infecting = polluted && step === 2 && local < 1;
    const alpha = infected ? 1 : 0.6;
    const color = infected ? palette.danger : palette.muted;

    // 상속 화살표
    ctx.strokeStyle = infected ? palette.danger : palette.border;
    ctx.globalAlpha = infected ? 0.6 : 0.35;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x + objW / 2, objY - 6);
    ctx.lineTo(width / 2, protoY + 42);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(x, objY, objW, 34, 5);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.14;
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.fillText(name, x + objW / 2, objY + 12);
    ctx.font = `9px ${MONO}`;
    ctx.fillStyle = color;
    ctx.fillText(infected || infecting ? "오염된 값이 보인다" : "—", x + objW / 2, objY + 25);
    ctx.globalAlpha = 1;
  });

  // 마지막 — 실행까지
  if (step >= 3) {
    ctx.globalAlpha = Math.min(1, local * 2);
    ctx.font = `600 11px ${MONO}`;
    ctx.fillStyle = palette.danger;
    ctx.fillText("오염된 프로퍼티를 읽는 코드 → 임의 JS 실행 → execSync()", width / 2, height - 18);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** 프로토타입 하나가 오염되면 그것을 물려받는 객체 전부가 함께 오염되는 구조. */
export function PrototypePollutionDemo() {
  return (
    <CanvasDemo
      caption="프로토타입 오염이 퍼지는 경로"
      height={222}
      duration={DURATION}
      draw={draw}
    />
  );
}
