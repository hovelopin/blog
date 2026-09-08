"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const DURATION = 9000;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** 요청이 들어오는 시각(0~1 정규화). 카운트다운보다 촘촘하면 회수가 영영 오지 않는다. */
const REQUESTS = [0.08, 0.22, 0.36, 0.48, 0.63, 0.76, 0.9];
/** 카운트다운 길이(전체 구간 대비 비율) */
const GC_WINDOW = 0.2;

/** 마지막 요청 이후 카운트다운이 얼마나 진행됐는지 (1 이면 회수) */
function countdown(t: number): { since: number; ratio: number; collected: boolean } {
  const last = REQUESTS.filter((r) => r <= t).pop() ?? 0;
  const since = t - last;
  return { since, ratio: Math.min(1, since / GC_WINDOW), collected: since >= GC_WINDOW };
}

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const w = width - pad * 2;
  const t = Math.min(1, elapsed / (DURATION * 0.95));

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  // 1) 요청 타임라인
  const lineY = 34;
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("같은 쿼리 요청 (일평균 2,000회 규모)", pad, 16);

  ctx.strokeStyle = palette.border;
  ctx.beginPath();
  ctx.moveTo(pad, lineY);
  ctx.lineTo(pad + w, lineY);
  ctx.stroke();

  for (const r of REQUESTS) {
    if (r > t) continue;
    const x = pad + r * w;
    ctx.beginPath();
    ctx.arc(x, lineY, 4, 0, Math.PI * 2);
    ctx.fillStyle = palette.primary;
    ctx.fill();
  }

  // 진행 위치
  const cx = pad + t * w;
  ctx.strokeStyle = palette.fg;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(cx, lineY - 12);
  ctx.lineTo(cx, height - 30);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 2) gcTime 카운트다운 막대 — 요청이 들어올 때마다 0 으로 되돌아간다
  const barY = lineY + 34;
  const barH = 18;
  const { ratio, collected } = countdown(t);

  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("gcTime 카운트다운", pad, barY - 14);

  ctx.fillStyle = palette.border;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.roundRect(pad, barY, w, barH, 4);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = collected ? palette.primary : palette.warn;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.roundRect(pad, barY, Math.max(2, w * ratio * 0.999), barH, 4);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.card;
  if (ratio > 0.12) ctx.fillText(collected ? "회수" : "카운트다운 중…", pad + 8, barY + barH / 2);

  // 리셋 표시
  const lastReq = REQUESTS.filter((r) => r <= t).pop();
  if (lastReq !== undefined && t - lastReq < 0.035) {
    ctx.font = `600 10px ${MONO}`;
    ctx.fillStyle = palette.danger;
    ctx.fillText("리셋!", pad + lastReq * w + 6, barY - 14);
  }

  // 3) 캐시 점유 — 회수되지 못하고 계속 남는다
  const cacheY = barY + barH + 30;
  ctx.font = `11px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("캐시에 남아 있는 응답", pad, cacheY - 14);

  const kept = REQUESTS.filter((r) => r <= t).length;
  const cellW = 26;
  for (let i = 0; i < kept; i++) {
    const x = pad + i * (cellW + 6);
    ctx.beginPath();
    ctx.roundRect(x, cacheY, cellW, 20, 4);
    ctx.fillStyle = palette.danger;
    ctx.globalAlpha = 0.16;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.danger;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(
    collected ? "카운트다운을 끝까지 채워야 회수된다" : "끝나기 전에 다음 요청이 와서 다시 0 부터",
    pad,
    height - 12,
  );

  ctx.textBaseline = "alphabetic";
}

/** gcTime 카운트다운이 새 요청 때문에 계속 리셋되는 모습을 보여준다. */
export function GcResetDemo() {
  return (
    <CanvasDemo
      caption="카운트다운이 끝나기 전에 같은 요청이 들어오면 회수는 미뤄진다"
      height={196}
      duration={DURATION}
      draw={draw}
    />
  );
}
