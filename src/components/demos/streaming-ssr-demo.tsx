"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const DURATION = 7000;

type Kind = "wait" | "work" | "send" | "hydrate";

interface Segment {
  from: number;
  to: number;
  label: string;
  kind: Kind;
}

interface Track {
  title: string;
  segments: Segment[];
  /** 첫 화면이 보이는 시각(ms) */
  firstPaint: number;
  /** 상호작용이 가능해지는 시각(ms) */
  interactive: number;
}

/** 동기 SSR: 데이터를 다 받아야 HTML 이 나오고, 전부 hydration 돼야 손이 닿는다. */
const SYNC: Track = {
  title: "renderToString — 순차",
  segments: [
    { from: 0, to: 2200, label: "데이터 전부 대기", kind: "wait" },
    { from: 2200, to: 2700, label: "HTML", kind: "work" },
    { from: 2700, to: 3000, label: "전송", kind: "send" },
    { from: 3000, to: 4000, label: "JS 번들 로드", kind: "wait" },
    { from: 4000, to: 5200, label: "전체 hydration", kind: "hydrate" },
  ],
  firstPaint: 3000,
  interactive: 5200,
};

/** 스트리밍 SSR: 준비된 셸부터 흘려보내고, 느린 조각은 나중에 끼워 넣는다. */
const STREAM: Track = {
  title: "renderToPipeableStream — 스트리밍",
  segments: [
    { from: 0, to: 300, label: "셸 렌더", kind: "work" },
    { from: 300, to: 500, label: "셸 전송", kind: "send" },
    { from: 500, to: 2200, label: "Post 대기 → fallback 노출", kind: "wait" },
    { from: 500, to: 1400, label: "JS 로드", kind: "wait" },
    { from: 1400, to: 1900, label: "hydration", kind: "hydrate" },
    { from: 2200, to: 2500, label: "Post 청크", kind: "send" },
    { from: 2500, to: 2900, label: "Post hydration", kind: "hydrate" },
  ],
  firstPaint: 500,
  interactive: 1900,
};

const PAD = 12;
const LABEL_H = 18;
const ROW_H = 20;
const ROW_GAP = 6;

function colorOf(kind: Kind, p: DrawArgs["palette"]): string {
  if (kind === "wait") return p.border;
  if (kind === "work") return p.muted;
  if (kind === "send") return p.primary;
  return p.warn;
}

function drawTrack(
  { ctx, palette }: DrawArgs,
  track: Track,
  top: number,
  left: number,
  trackW: number,
  elapsed: number,
) {
  const x = (t: number) => left + (t / DURATION) * trackW;

  ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = palette.fg;
  ctx.textBaseline = "middle";
  ctx.fillText(track.title, left, top + LABEL_H / 2);

  // 세그먼트를 겹치지 않게 줄로 나눈다(스트리밍은 병렬 구간이 있다).
  const rows: Segment[][] = [];
  for (const seg of track.segments) {
    let placed = false;
    for (const row of rows) {
      if (row.every((s) => seg.from >= s.to || seg.to <= s.from)) {
        row.push(seg);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([seg]);
  }

  rows.forEach((row, ri) => {
    const y = top + LABEL_H + 6 + ri * (ROW_H + ROW_GAP);
    for (const seg of row) {
      const x0 = x(seg.from);
      const full = x(seg.to) - x0;
      // 진행선이 지나간 만큼만 채운다.
      const shown = Math.max(0, Math.min(full, x(Math.min(elapsed, seg.to)) - x0));
      if (shown <= 0) continue;

      ctx.fillStyle = colorOf(seg.kind, palette);
      ctx.globalAlpha = seg.kind === "wait" ? 0.55 : 0.9;
      ctx.beginPath();
      ctx.roundRect(x0, y, shown, ROW_H, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      // 다 자란 뒤에도 안 들어가는 라벨은 아예 그리지 않는다(잘린 글자 방지).
      const fits = ctx.measureText(seg.label).width + 14 <= full;
      if (fits && shown > 14) {
        ctx.fillStyle = seg.kind === "wait" ? palette.muted : palette.card;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, y, shown, ROW_H);
        ctx.clip();
        ctx.fillText(seg.label, x0 + 6, y + ROW_H / 2 + 0.5);
        ctx.restore();
      }
    }
  });

  const rowsBottom = top + LABEL_H + 6 + rows.length * (ROW_H + ROW_GAP);

  // 첫 화면 / 상호작용 시점 마커
  const marks: [number, string, string][] = [
    [track.firstPaint, "첫 화면", palette.primary],
    [track.interactive, "상호작용", palette.fg],
  ];
  let labelRight = -Infinity;
  let labelRow = 0;
  for (const [t, label, color] of marks) {
    if (elapsed < t) continue;
    const mx = x(t);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, top + LABEL_H);
    ctx.lineTo(mx, rowsBottom - ROW_GAP + 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = color;
    const text = `${label} ${(t / 1000).toFixed(1)}s`;
    // 앞 라벨과 겹치면 한 줄 아래로 내린다.
    if (mx + 4 < labelRight) labelRow += 1;
    else labelRow = 0;
    ctx.fillText(text, mx + 4, rowsBottom + 4 + labelRow * 12);
    labelRight = mx + 4 + ctx.measureText(text).width + 8;
  }

  return rowsBottom + 16 + (labelRow > 0 ? 12 : 0);
}

function draw(args: DrawArgs) {
  const { ctx, width, height, elapsed, palette } = args;
  const left = PAD;
  const trackW = width - PAD * 2;

  ctx.textBaseline = "middle";

  // 시간 눈금
  ctx.strokeStyle = palette.border;
  ctx.globalAlpha = 0.5;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  for (let s = 0; s <= DURATION / 1000; s++) {
    const gx = left + (s / (DURATION / 1000)) * trackW;
    ctx.beginPath();
    ctx.moveTo(gx, 16);
    ctx.lineTo(gx, height - 14);
    ctx.stroke();
    ctx.fillStyle = palette.muted;
    ctx.globalAlpha = 0.75;
    const last = s === DURATION / 1000;
    ctx.textAlign = last ? "right" : "left";
    ctx.fillText(`${s}s`, last ? gx - 2 : gx + 3, height - 7);
    ctx.textAlign = "left";
    ctx.globalAlpha = 0.5;
  }
  ctx.globalAlpha = 1;

  let y = 18;
  y = drawTrack(args, SYNC, y, left, trackW, elapsed);
  drawTrack(args, STREAM, y + 6, left, trackW, elapsed);

  // 진행선
  const px = left + (elapsed / DURATION) * trackW;
  ctx.strokeStyle = palette.fg;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(px, 14);
  ctx.lineTo(px, height - 16);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** 동기 SSR 과 스트리밍 SSR 의 타임라인을 나란히 재생한다. */
export function StreamingSsrDemo() {
  return (
    <CanvasDemo
      caption="같은 페이지를 두 방식으로 그렸을 때의 타임라인"
      height={250}
      duration={DURATION}
      draw={draw}
    />
  );
}
