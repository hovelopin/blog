"use client";

import { CanvasDemo, twoLanes, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const DURATION = 5000;

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  stroke: string,
  fill: string | null,
  text: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = text;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + 8, y + 6);
}

function lane(
  { ctx, palette, elapsed }: DrawArgs,
  x: number,
  w: number,
  laneH: number,
  title: string,
  peer: boolean,
) {
  const appX = x;
  const appY = 26;
  const appW = w;
  const appH = laneH - 52;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(title, x, 12);

  box(ctx, appX, appY, appW, appH, "app  (react 19.2.4)", palette.border, null, palette.muted);

  // 앱의 react
  const rW = Math.min(150, appW - 24);
  const rY = appY + 26;
  box(ctx, appX + 12, rY, rW, 24, "react 19.2.4", palette.primary, null, palette.primary);

  // 라이브러리 상자
  const libY = rY + 40;
  const libH = peer ? 30 : 62;
  const t = Math.max(0, Math.min(1, (elapsed - 900) / 600));
  box(
    ctx,
    appX + 12,
    libY,
    appW - 24,
    libH,
    peer ? "lib  (peerDependencies)" : "lib  (dependencies)",
    palette.border,
    null,
    palette.muted,
  );

  if (peer) {
    // 앱의 react 를 가리키는 화살표
    ctx.globalAlpha = t;
    ctx.strokeStyle = palette.primary;
    ctx.beginPath();
    ctx.moveTo(appX + 12 + rW / 2, libY);
    ctx.lineTo(appX + 12 + rW / 2, rY + 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(appX + 12 + rW / 2, rY + 24);
    ctx.lineTo(appX + 12 + rW / 2 - 4, rY + 30);
    ctx.lineTo(appX + 12 + rW / 2 + 4, rY + 30);
    ctx.closePath();
    ctx.fillStyle = palette.primary;
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    // 라이브러리가 자기 react 를 따로 설치한다
    ctx.globalAlpha = t;
    box(ctx, appX + 24, libY + 28, rW, 24, "react 18.3.1", palette.danger, null, palette.danger);
    ctx.globalAlpha = 1;
  }

  if (t >= 1) {
    ctx.font = `600 10px ${MONO}`;
    ctx.fillStyle = peer ? palette.primary : palette.danger;
    ctx.textBaseline = "middle";
    ctx.fillText(
      peer ? "인스턴스 1개 · same instance? true" : "인스턴스 2개 · same instance? false",
      x,
      laneH - 12,
    );
  }
  ctx.textBaseline = "alphabetic";
}

function draw(args: DrawArgs) {
  twoLanes(
    args,
    { pad: 14, gap: 28, divider: true },
    (x, w, h) => lane(args, x, w, h, "dependencies 에 react", false),
    (x, w, h) => lane(args, x, w, h, "peerDependencies 에 react", true),
  );
}

/** 라이브러리가 react 를 어느 필드에 두느냐에 따라 앱 안에 react 가 몇 개 생기는지. */
export function DuplicateReactDemo() {
  return (
    <CanvasDemo
      caption="앱(react 19)이 react 를 쓰는 라이브러리를 설치했을 때"
      height={196}
      duration={DURATION}
      draw={draw}
      stackable
    />
  );
}
