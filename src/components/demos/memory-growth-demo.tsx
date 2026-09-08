"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const DURATION = 9000;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

interface Series {
  label: string;
  /** 0~1 로 정규화한 힙 사용량을 시간(0~1)에 대해 돌려준다. */
  at: (t: number) => number;
  leaking: boolean;
}

interface Preset {
  caption: string;
  limitLabel: string;
  series: [Series, Series];
}

/** 회수되지 않고 우상향하는 곡선. 중간중간 작은 GC 시도가 있지만 바닥이 계속 올라간다. */
const leak = (t: number) => Math.min(1.02, 0.18 + t * 0.9 + Math.sin(t * 22) * 0.018);

/** 톱니 모양으로 올랐다 회수되는 곡선. 바닥선이 유지된다. */
const healthy = (t: number) => {
  const saw = (t * 5) % 1;
  return 0.2 + saw * 0.32;
};

const PRESETS: Record<string, Preset> = {
  // memory-leak-3: gcTime 24시간을 걷어내기 전후
  gctime: {
    caption: "부하 테스트 중 서버 힙 사용량 — gcTime 정리 전후",
    limitLabel: "컨테이너 한계 (OOM)",
    series: [
      { label: "Before — gcTime 24h", at: leak, leaking: true },
      { label: "After — gcTime 제거", at: healthy, leaking: false },
    ],
  },
  // memory-leak-4: SSR 에서 타이머가 등록되느냐 아니냐
  ssr: {
    caption: "SSR 요청이 쌓일 때 캐시가 회수되는가",
    limitLabel: "컨테이너 한계 (OOM)",
    series: [
      { label: "gcTime 지정 — 타이머 등록, 회수 안 됨", at: leak, leaking: true },
      { label: "server default(Infinity) — 요청 끝나면 통째 폐기", at: healthy, leaking: false },
    ],
  },
};

function drawChart(
  { ctx, palette }: DrawArgs,
  s: Series,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  limitLabel: string,
) {
  const color = s.leaking ? palette.danger : palette.primary;

  ctx.font = `600 11px ${MONO}`;
  ctx.fillStyle = palette.fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(s.label, x, y - 10);

  // 축
  ctx.strokeStyle = palette.border;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // OOM 한계선
  const limitY = y + 6;
  ctx.strokeStyle = palette.danger;
  ctx.globalAlpha = 0.45;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, limitY);
  ctx.lineTo(x + w, limitY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `9px ${MONO}`;
  ctx.fillStyle = palette.danger;
  ctx.globalAlpha = 0.8;
  ctx.fillText(limitLabel, x + 4, limitY + 9);
  ctx.globalAlpha = 1;

  // 곡선 + 아래 면적
  const pts: [number, number][] = [];
  const steps = Math.max(2, Math.round(w * progress));
  for (let i = 0; i <= steps; i++) {
    const t = (i / w) * progress * (w / Math.max(1, steps)) * (steps / w) || 0;
    const tt = (i / Math.max(1, steps)) * progress;
    pts.push([x + tt * w, y + h - Math.min(1, s.at(tt)) * (h - 6)]);
    void t;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0][0], y + h);
  for (const [px, py] of pts) ctx.lineTo(px, py);
  ctx.lineTo(pts[pts.length - 1][0], y + h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.12;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.lineWidth = 1;

  // 현재 지점
  const [lx, ly] = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(lx, ly, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // OOM 도달 표시
  if (s.leaking && s.at(progress) >= 0.98) {
    ctx.font = `600 10px ${MONO}`;
    ctx.fillStyle = palette.danger;
    ctx.textAlign = "right";
    ctx.fillText("OOM", x + w - 4, limitY + 9);
    ctx.textAlign = "left";
  }
}

function makeDraw(preset: Preset) {
  return (args: DrawArgs) => {
    const { width, height, elapsed } = args;
    const pad = 14;
    const gap = 22;
    const colW = (width - pad * 2 - gap) / 2;
    const chartTop = 34;
    const chartH = height - chartTop - 26;
    const progress = Math.min(1, elapsed / (DURATION * 0.92));

    preset.series.forEach((s, i) => {
      drawChart(
        args,
        s,
        pad + i * (colW + gap),
        chartTop,
        colW,
        chartH,
        progress,
        preset.limitLabel,
      );
    });

    const { ctx, palette } = args;
    ctx.font = `9px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "left";
    ctx.fillText("→ 시간", pad, height - 8);
  };
}

/** 힙 사용량이 계속 쌓이는 경우와 제때 회수되는 경우를 나란히 그린다. */
export function MemoryGrowthDemo({ preset = "gctime" }: { preset?: keyof typeof PRESETS }) {
  const p = PRESETS[preset] ?? PRESETS.gctime;
  return <CanvasDemo caption={p.caption} height={210} duration={DURATION} draw={makeDraw(p)} />;
}
