"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const DURATION = 5200;
const FADE_START = 1200;
const FADE = 1400;

const MODULES = ["formatDate", "slugify", "clamp", "debounce", "deepEqual"];
const USED = "slugify";
/** app-esm / app-cjs 의 dist/main.js 크기 (raw bytes). */
const ESM_FULL = 2081;
const ESM_SHAKEN = 364;
const CJS = 2450;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function row(
  { ctx, width, palette }: DrawArgs,
  y: number,
  title: string,
  fade: number,
  bytes: number,
  note: string,
) {
  const pad = 14;
  const boxH = 30;
  const gap = 8;
  const labelW = 46;
  const sizeW = 92;
  const boxesW = width - pad * 2 - labelW - sizeW;
  const boxW = (boxesW - gap * (MODULES.length - 1)) / MODULES.length;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(title, pad, y + boxH / 2);

  MODULES.forEach((m, i) => {
    const x = pad + labelW + i * (boxW + gap);
    const used = m === USED;
    const alpha = used ? 1 : 1 - fade * 0.85;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = used ? palette.primary : palette.border;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 5);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = used ? palette.card : palette.fg;
    ctx.textAlign = "center";
    ctx.fillText(m, x + boxW / 2, y + boxH / 2);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  });

  ctx.font = `600 12px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.textAlign = "right";
  ctx.fillText(`${bytes.toLocaleString()} B`, width - pad, y + boxH / 2);
  ctx.textAlign = "left";
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(note, pad + labelW, y + boxH + 14);
  ctx.textBaseline = "alphabetic";
}

function draw(args: DrawArgs) {
  const { elapsed } = args;
  const t = easeOut(Math.max(0, Math.min(1, (elapsed - FADE_START) / FADE)));
  const esmBytes = Math.round(ESM_FULL - (ESM_FULL - ESM_SHAKEN) * t);
  row(args, 26, "ESM", t, esmBytes, "import { slugify } — 정적 구조라 나머지 넷을 잘라낼 수 있다");
  row(
    args,
    104,
    "CJS",
    0,
    CJS,
    "require 는 실행해 봐야 알 수 있어서 모듈 전체가 남는다 (+ 런타임 헬퍼)",
  );
}

/** 함수 하나만 import 했을 때 두 포맷의 소비자 번들에 무엇이 남는지. */
export function TreeShakeDemo() {
  return (
    <CanvasDemo
      caption="함수 5개짜리 라이브러리에서 slugify 하나만 가져온 소비자 번들"
      height={158}
      duration={DURATION}
      draw={draw}
    />
  );
}
