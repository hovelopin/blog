"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const DURATION = 3000;
// 화면에서 읽히도록 실제 ms 를 4배 느리게 재생한다.
const SCALE = 4;
const DELAY_MS = 300;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

interface Case {
  title: string;
  /** 데이터 로딩에 걸리는 시간(ms, 실제 기준) */
  load: number;
  note: string;
}

const CASES: Case[] = [
  { title: "로딩 200ms — Delay 300ms 보다 빠름", load: 200, note: "스피너가 아예 안 뜬다" },
  { title: "로딩 800ms — Delay 300ms 보다 느림", load: 800, note: "300ms 뒤부터 스피너" },
];

type Phase = "blank" | "spinner" | "content";

function phaseAt(t: number, load: number): Phase {
  if (t >= load) return "content";
  return t < DELAY_MS ? "blank" : "spinner";
}

function drawCase(
  { ctx, palette }: DrawArgs,
  c: Case,
  x: number,
  y: number,
  w: number,
  tReal: number,
) {
  const phase = phaseAt(tReal, c.load);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.fillText(c.title, x, y);

  // 시간 막대: Delay 구간과 로딩 구간을 겹쳐 보여준다
  const barY = y + 18;
  const barH = 12;
  const total = DURATION / SCALE; // 이 데모가 다루는 실제 시간 범위(ms)
  const px = (ms: number) => (Math.min(ms, total) / total) * w;

  ctx.fillStyle = palette.border;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.roundRect(x, barY, w, barH, 3);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 로딩(=fallback 이 살아 있는 시간)
  ctx.fillStyle = palette.muted;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.roundRect(x, barY, px(Math.min(tReal, c.load)), barH, 3);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Delay 타이머 경계
  const dx = x + px(DELAY_MS);
  ctx.strokeStyle = palette.primary;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(dx, barY - 4);
  ctx.lineTo(dx, barY + barH + 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `9px ${MONO}`;
  ctx.fillStyle = palette.primary;
  ctx.fillText("300ms", dx + 3, barY - 8);

  // 진행 위치
  const cx = x + px(tReal);
  ctx.strokeStyle = palette.fg;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(cx, barY - 6);
  ctx.lineTo(cx, barY + barH + 6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 화면 박스
  const boxY = barY + barH + 16;
  const boxH = 74;
  ctx.beginPath();
  ctx.roundRect(x, boxY, w, boxH, 8);
  ctx.fillStyle = palette.card;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.border;
  ctx.stroke();

  const midX = x + w / 2;
  const midY = boxY + boxH / 2;
  ctx.textAlign = "center";

  if (phase === "blank") {
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.globalAlpha = 0.7;
    ctx.fillText("(빈 화면)", midX, midY);
    ctx.globalAlpha = 1;
  } else if (phase === "spinner") {
    // 회전하는 호로 스피너를 흉내낸다
    const a = (tReal / 90) % (Math.PI * 2);
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(midX, midY - 6, 10, a, a + Math.PI * 1.4);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText("Spinner", midX, midY + 20);
  } else {
    ctx.fillStyle = palette.primary;
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.roundRect(x + 14, boxY + 16, w - 28, 12, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 14, boxY + 34, (w - 28) * 0.7, 12, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = palette.primary;
    ctx.textAlign = "left";
    ctx.fillText("실제 내용", x + 14, boxY + boxH - 12);
  }

  ctx.textAlign = "left";
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(c.note, x, boxY + boxH + 14);
}

function draw(args: DrawArgs) {
  const { width, elapsed } = args;
  const pad = 14;
  const gap = 20;
  const colW = (width - pad * 2 - gap) / 2;
  const tReal = elapsed / SCALE;

  drawCase(args, CASES[0], pad, 16, colW, tReal);
  drawCase(args, CASES[1], pad + colW + gap, 16, colW, tReal);
}

/** 로딩 시간과 Delay 타이머의 경쟁을 두 경우로 나란히 재생한다. */
export function DelayRaceDemo() {
  return (
    <CanvasDemo
      caption="Delay ms={300} 아래에서 로딩 시간에 따라 화면이 달라진다 (4배 느리게 재생)"
      height={168}
      duration={DURATION}
      draw={draw}
    />
  );
}
