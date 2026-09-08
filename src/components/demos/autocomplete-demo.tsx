"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const STEP = 1500;
const DURATION = STEP * 4;

const STRING_CANDIDATES = [
  "'pages.notFound.title'",
  "'pages.notFound.description'",
  "'pages.home.title'",
];

/** selector 는 한 단계씩 좁혀 들어간다. */
const SELECTOR_STEPS = [
  { typed: "$.", options: ["pages"] },
  { typed: "$.pages.", options: ["notFound", "home"] },
  { typed: "$.pages.notFound.", options: ["title", "description"] },
];

function drawPanel(
  { ctx, palette }: DrawArgs,
  x: number,
  y: number,
  w: number,
  title: string,
  typed: string,
  options: string[],
  reveal: number,
) {
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(title, x, y);

  // 입력 줄
  const inputY = y + 20;
  ctx.beginPath();
  ctx.roundRect(x, inputY, w, 26, 5);
  ctx.fillStyle = palette.card;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.border;
  ctx.stroke();

  ctx.font = `12px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(typed, x + 8, inputY + 13);
  // 커서
  const caretX = x + 8 + ctx.measureText(typed).width + 1;
  ctx.strokeStyle = palette.primary;
  ctx.beginPath();
  ctx.moveTo(caretX, inputY + 6);
  ctx.lineTo(caretX, inputY + 20);
  ctx.stroke();

  // 후보 목록
  const listY = inputY + 34;
  const rowH = 22;
  options.forEach((opt, i) => {
    const shown = Math.min(1, Math.max(0, reveal * options.length - i));
    if (shown <= 0) return;
    const oy = listY + i * rowH;
    ctx.globalAlpha = shown;
    ctx.beginPath();
    ctx.roundRect(x, oy, w, rowH - 3, 4);
    ctx.fillStyle = i === 0 ? palette.primary : palette.muted;
    ctx.globalAlpha = shown * (i === 0 ? 0.16 : 0.08);
    ctx.fill();
    ctx.globalAlpha = shown;
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = i === 0 ? palette.primary : palette.muted;
    ctx.fillText(opt, x + 8, oy + (rowH - 3) / 2);
    ctx.globalAlpha = 1;
  });
}

function draw(args: DrawArgs) {
  const { width, height, elapsed, ctx, palette } = args;
  const pad = 14;
  const gap = 22;
  const colW = (width - pad * 2 - gap) / 2;
  const step = Math.min(SELECTOR_STEPS.length - 1, Math.floor(elapsed / STEP));
  const local = (elapsed % STEP) / STEP;

  // 왼쪽 — 문자열 방식은 전체 목록을 한 번에 보여준다
  drawPanel(
    args,
    pad,
    18,
    colW,
    "문자열 방식 — 후보 목록",
    "t('pages",
    STRING_CANDIDATES,
    Math.min(1, elapsed / STEP),
  );

  // 오른쪽 — selector 는 프로퍼티를 타고 내려간다
  const s = SELECTOR_STEPS[step];
  drawPanel(
    args,
    pad + colW + gap,
    18,
    colW,
    "selector 방식 — 프로퍼티 탐색",
    `t(${s.typed}`,
    s.options,
    Math.min(1, local * 2.2),
  );

  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.textAlign = "left";
  ctx.fillText("경로 전체를 문자열로 고른다", pad, height - 10);
  ctx.fillText("한 단계씩 객체를 타고 내려간다", pad + colW + gap, height - 10);
}

/** 같은 리소스를 두고 자동완성이 어떻게 다르게 뜨는지 나란히 보여준다. */
export function AutocompleteDemo() {
  return (
    <CanvasDemo
      caption="IDE 자동완성 — 문자열 목록과 프로퍼티 트리"
      height={190}
      duration={DURATION}
      draw={draw}
    />
  );
}
