"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const STEP_MS = 1300;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** 리소스 트리를 왼쪽에, 거기서 펼쳐진 문자열 키를 오른쪽에 둔다. */
const TREE: { depth: number; label: string; leaf?: string }[] = [
  { depth: 0, label: "pages" },
  { depth: 1, label: "notFound" },
  { depth: 2, label: "title", leaf: "pages.notFound.title" },
  { depth: 2, label: "description", leaf: "pages.notFound.description" },
  { depth: 1, label: "home" },
  { depth: 2, label: "title", leaf: "pages.home.title" },
];

const LEAVES = TREE.filter((n) => n.leaf);
const DURATION = STEP_MS * (LEAVES.length + 2);

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const colW = (width - pad * 2 - 24) / 2;
  const rightX = pad + colW + 24;
  const step = Math.floor(elapsed / STEP_MS);
  const local = (elapsed % STEP_MS) / STEP_MS;

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText("CustomTypeOptions.resources", pad, 16);
  ctx.fillText("ParseKeys — 허용되는 문자열 union", rightX, 16);

  // 왼쪽 트리
  const rowH = 22;
  TREE.forEach((node, i) => {
    const y = 36 + i * rowH;
    const leafIndex = node.leaf ? LEAVES.findIndex((l) => l.leaf === node.leaf) : -1;
    const lit = leafIndex >= 0 && leafIndex < step;
    const lighting = leafIndex >= 0 && leafIndex === step;

    const text = `${"  ".repeat(node.depth)}${node.depth > 0 ? "└ " : ""}${node.label}`;
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = node.leaf ? (lit || lighting ? palette.primary : palette.fg) : palette.muted;
    ctx.globalAlpha = node.leaf ? 1 : 0.75;
    ctx.fillText(text, pad, y);
    ctx.globalAlpha = 1;

    // 리프에서 오른쪽 union 항목으로 이어지는 선.
    // 글자 바로 뒤에서 시작해 `|` 바로 앞에서 끝나야 둘이 이어져 보인다.
    // (예전엔 왼쪽 열 끝에서 시작해 글자와 선 사이가 비어 공중에 뜬 선처럼 보였다)
    if (lighting || lit) {
      const alpha = lighting ? Math.min(1, local * 2) : 0.6;
      const x1 = pad + ctx.measureText(text).width + 6;
      const x2 = rightX - 6;
      const y2 = 40 + leafIndex * 26;
      const midX = (x1 + x2) / 2;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = palette.primary;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      // 양 끝이 수평으로 들고 나는 곡선이라 행 높이가 달라도 연결선으로 읽힌다
      ctx.bezierCurveTo(midX, y, midX, y2, x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = palette.primary;
      for (const [cx, cy] of [
        [x1, y],
        [x2, y2],
      ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  });

  // 오른쪽 union
  LEAVES.forEach((leaf, i) => {
    if (i > step) return;
    const appearing = i === step;
    const alpha = appearing ? Math.min(1, local * 2) : 1;
    const y = 40 + i * 26;

    ctx.globalAlpha = alpha;
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText(i === 0 ? "|" : "|", rightX, y);
    ctx.fillStyle = palette.primary;
    ctx.fillText(`'${leaf.leaf}'`, rightX + 14, y);
    ctx.globalAlpha = 1;
  });

  // 마무리 문구
  if (step >= LEAVES.length) {
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.fillText("값이 객체인 중간 경로는 키로 남지 않는다", rightX, 40 + LEAVES.length * 26 + 6);
    ctx.fillStyle = palette.fg;
    ctx.font = `600 11px ${MONO}`;
    ctx.fillText("t('pages.notFound.title') 만 통과", pad, height - 14);
  }

  ctx.textBaseline = "alphabetic";
}

/** 리소스 트리가 문자열 key union 으로 펼쳐지는 과정을 보여준다. */
export function KeyUnionDemo() {
  return (
    <CanvasDemo
      caption="리소스 구조를 펼쳐 '허용된 문자열 목록'을 만든다"
      height={210}
      duration={DURATION}
      draw={draw}
    />
  );
}
