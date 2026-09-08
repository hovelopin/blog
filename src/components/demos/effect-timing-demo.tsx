"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const STEP_MS = 1400;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

interface Phase {
  name: string;
  detail: string;
  /** 이 단계에서 ref.impl 이 최신 콜백을 가리키게 되는가 */
  updatesRef?: boolean;
}

const PHASES: Phase[] = [
  { name: "Render", detail: "eventFn 호출 시 에러 — 아직 커밋 전이다" },
  { name: "Mutation", detail: "ref.impl = nextImpl · Effect Event 갱신", updatesRef: true },
  { name: "Layout", detail: "useLayoutEffect 실행" },
  { name: "Passive", detail: "useEffect 실행 — 여기서 읽으면 이미 최신" },
];

const DURATION = STEP_MS * (PHASES.length + 1);

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const active = Math.min(PHASES.length - 1, Math.floor(elapsed / STEP_MS));
  const local = (elapsed % STEP_MS) / STEP_MS;
  const refFresh = active >= 1;

  const laneY = 52;
  const laneH = 30;
  const w = width - pad * 2;
  const cellW = w / PHASES.length;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("커밋 단계 진행", pad, 20);

  PHASES.forEach((p, i) => {
    const x = pad + i * cellW;
    const done = i < active;
    const now = i === active;
    const alpha = done ? 1 : now ? Math.min(1, local * 2.4) : 0.24;
    const color = p.updatesRef ? palette.primary : palette.muted;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(x + 3, laneY, cellW - 6, laneH, 5);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * (p.updatesRef ? 0.2 : 0.1);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.font = `600 11px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.textAlign = "center";
    ctx.fillText(p.name, x + cellW / 2, laneY + laneH / 2);
    ctx.globalAlpha = 1;

    // 화살표
    if (i < PHASES.length - 1 && i < active) {
      ctx.strokeStyle = palette.border;
      ctx.beginPath();
      ctx.moveTo(x + cellW - 3, laneY + laneH / 2);
      ctx.lineTo(x + cellW + 3, laneY + laneH / 2);
      ctx.stroke();
    }
  });

  // 현재 단계 설명
  ctx.textAlign = "left";
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(PHASES[active].detail, pad, laneY + laneH + 24);

  // ref.impl 상태
  const refY = laneY + laneH + 52;
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("ref.impl 이 가리키는 콜백", pad, refY - 12);

  const boxW = Math.min(260, w);
  ctx.beginPath();
  ctx.roundRect(pad, refY, boxW, 28, 5);
  ctx.fillStyle = refFresh ? palette.primary : palette.warn;
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = refFresh ? palette.primary : palette.warn;
  ctx.stroke();

  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(
    refFresh ? "이번 렌더의 최신 콜백" : "직전 렌더의 콜백 (stale)",
    pad + 10,
    refY + 14,
  );

  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(
    refFresh
      ? "Passive 에서 읽어도 안전하다"
      : "이 시점에 부르면 한 박자 늦은 값을 읽는다 — React 가 에러로 막는다",
    pad,
    height - 12,
  );

  ctx.textBaseline = "alphabetic";
}

/** useEffectEvent 의 ref 가 언제 갱신되는지를 커밋 단계 위에 올려 보여준다. */
export function EffectTimingDemo() {
  return (
    <CanvasDemo
      caption="ref.impl 갱신은 useLayoutEffect·useEffect 보다 먼저 끝난다"
      height={200}
      duration={DURATION}
      draw={draw}
    />
  );
}
