"use client";

import { CanvasDemo, twoLanes, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const STEP = 1500;
const RENDERS = ["v1", "v2", "v3"];
const DURATION = STEP * (RENDERS.length + 1);

function drawLane(
  { ctx, palette }: DrawArgs,
  x: number,
  w: number,
  title: string,
  fresh: boolean,
  step: number,
  local: number,
) {
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(title, x, 18);

  // 렌더가 진행되며 콜백이 바뀐다.
  // 레인 안의 요소는 모두 같은 내용 폭(w - 12)을 쓴다. 칩 줄만 w 를 꽉 채우면
  // 오른쪽 레인에서 카드 테두리에 붙어 잘린 것처럼 보인다.
  const rowY = 42;
  const CHIP_GAP = 6;
  const laneW = w - 12;
  const cellW = (laneW - CHIP_GAP * (RENDERS.length - 1)) / RENDERS.length;
  RENDERS.forEach((r, i) => {
    const active = i <= step;
    const now = i === step;
    const alpha = active ? (now ? Math.min(1, local * 2.4) : 1) : 0.2;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(x + i * (cellW + CHIP_GAP), rowY, cellW, 24, 4);
    ctx.fillStyle = palette.primary;
    ctx.globalAlpha = alpha * 0.14;
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = palette.primary;
    ctx.stroke();
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.fg;
    ctx.textAlign = "center";
    ctx.fillText(`onCancel ${r}`, x + i * (cellW + CHIP_GAP) + cellW / 2, rowY + 12);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  });

  // effect 가 잡고 있는 콜백
  const heldIndex = fresh ? step : 0;
  const boxY = rowY + 48;
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("ESC effect 가 부르는 콜백", x, boxY - 12);

  const color = fresh ? palette.primary : palette.danger;
  ctx.beginPath();
  ctx.roundRect(x, boxY, laneW, 28, 5);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.font = `600 12px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(`onCancel ${RENDERS[heldIndex]}`, x + 10, boxY + 14);

  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(
    fresh ? "매 렌더마다 최신으로 갈아 끼운다" : "구독할 때 잡은 콜백에 그대로 묶여 있다",
    x,
    boxY + 44,
  );
}

function draw(args: DrawArgs) {
  const { ctx, elapsed } = args;
  const step = Math.min(RENDERS.length - 1, Math.floor(elapsed / STEP));
  const local = (elapsed % STEP) / STEP;

  twoLanes(
    args,
    { pad: 14, gap: 20, divider: true },
    (x, w) => drawLane(args, x, w, "의존성 없이 한 번만 구독하면", false, step, local),
    (x, w) => drawLane(args, x, w, "ref · Effect Event 를 끼우면", true, step, local),
  );
  ctx.textBaseline = "alphabetic";
}

/** 렌더가 바뀔 때 effect 가 어떤 콜백을 붙들고 있는지 비교한다. */
export function StaleClosureDemo() {
  return (
    <CanvasDemo
      caption="렌더가 세 번 도는 동안 effect 가 부르는 콜백"
      height={196}
      stackable
      duration={DURATION}
      draw={draw}
    />
  );
}
