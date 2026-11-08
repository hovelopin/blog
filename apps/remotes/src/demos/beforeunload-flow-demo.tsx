import { CanvasDemo, type DemoPalette, type DrawArgs } from "./canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
/** 한 단계가 켜지는 간격(ms) */
const STEP_MS = 1000;
const STEPS = 8;
const DURATION = STEP_MS * (STEPS + 2);

const TOP = 62;
const ROW_GAP = 44;
const BOX_H = 28;

type Lane = "page" | "browser";

interface Node {
  lane: Lane;
  row: number;
  label: string;
  /** 몇 번째 단계에서 켜지는가 */
  step: number;
  /** 브라우저 칸 안에서 반으로 나눠 놓는 노드(취소/나가기) */
  half?: "left" | "right";
}

const NODES: Record<string, Node> = {
  click: { lane: "browser", row: 0, label: "새로고침 클릭", step: 0 },
  dispatch: { lane: "browser", row: 1, label: "beforeunload 발생", step: 1 },
  handler: { lane: "page", row: 2, label: "preventDefault()", step: 2 },
  // sticky activation. 표준의 activation-triggering input event 는 마우스 누름·탭·키 입력이다.
  // 스크롤이나 hover 는 들어가지 않는다.
  sticky: { lane: "browser", row: 3, label: "클릭·탭·키 입력이 있었나?", step: 4 },
  dialog: { lane: "browser", row: 4, label: "확인창 · JS 멈춤", step: 5 },
  cancel: { lane: "browser", row: 5, label: "취소 → 남음", step: 6, half: "left" },
  leave: { lane: "browser", row: 5, label: "나가기 → unload", step: 6, half: "right" },
};

interface Layout {
  pad: number;
  /** 페이지 칸과 브라우저 칸의 경계 x */
  split: number;
  width: number;
}

function cy(row: number) {
  return TOP + row * ROW_GAP;
}

/** 노드의 사각형. 페이지 칸은 칸 폭 전체, 브라우저 칸은 가운데 정렬. */
function rectOf(node: Node, l: Layout) {
  const laneX = node.lane === "page" ? l.pad : l.split + 16;
  const laneW = node.lane === "page" ? l.split - l.pad - 16 : l.width - l.pad - laneX;
  let x = laneX;
  let w = laneW;
  if (node.half) {
    w = (laneW - 12) / 2;
    if (node.half === "right") x = laneX + w + 12;
  }
  return { x, y: cy(node.row) - BOX_H / 2, w, h: BOX_H };
}

/** 단계가 켜진 정도. 0 이면 아직, 1 이면 완전히 켜짐. */
function reveal(step: number, elapsed: number) {
  return Math.max(0, Math.min(1, (elapsed - step * STEP_MS) / 350));
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: Node,
  l: Layout,
  palette: DemoPalette,
  elapsed: number,
) {
  const { x, y, w, h } = rectOf(node, l);
  const on = reveal(node.step, elapsed);
  const isPage = node.lane === "page";
  const color = isPage ? palette.primary : palette.fg;

  // 아직 켜지지 않은 노드도 자리만 흐리게 보여서 전체 구조가 먼저 읽히게 한다.
  ctx.globalAlpha = 0.18 + on * 0.82;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fillStyle = palette.card;
  ctx.fill();
  if (isPage) {
    ctx.globalAlpha = (0.18 + on * 0.82) * 0.14;
    ctx.fillStyle = palette.primary;
    ctx.fill();
    ctx.globalAlpha = 0.18 + on * 0.82;
  }
  ctx.strokeStyle = isPage ? palette.primary : palette.border;
  ctx.lineWidth = isPage ? 1.5 : 1;
  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.font = `${isPage ? 600 : 500} 12px ${MONO}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.label, x + w / 2, y + h / 2 + 0.5);
  ctx.globalAlpha = 1;
}

/** 꺾인 화살표. points 를 순서대로 잇고 마지막 점에 화살촉을 단다. */
function arrow(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  progress: number,
) {
  if (progress <= 0) return;
  // 선 길이를 따라 progress 만큼만 그려 화살표가 뻗어 나가는 느낌을 준다.
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = total * progress;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  let end = points[0];
  let dir: [number, number] = [0, 1];
  for (let i = 0; i < segs.length && left > 0; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const t = Math.min(1, left / segs[i]);
    end = [ax + (bx - ax) * t, ay + (by - ay) * t];
    dir = [(bx - ax) / segs[i], (by - ay) / segs[i]];
    ctx.lineTo(end[0], end[1]);
    left -= segs[i];
  }
  ctx.stroke();
  if (progress >= 1) {
    const [ex, ey] = end;
    const [dx, dy] = dir;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - dx * 6 - dy * 3.5, ey - dy * 6 + dx * 3.5);
    ctx.lineTo(ex - dx * 6 + dy * 3.5, ey - dy * 6 - dx * 3.5);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function draw({ ctx, width, height, elapsed, palette }: DrawArgs) {
  const pad = 14;
  const l: Layout = { pad, width, split: Math.round(width * 0.34) };
  const r = (k: keyof typeof NODES) => rectOf(NODES[k], l);

  // 칸 이름과 경계선
  ctx.font = `600 11px ${MONO}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = palette.primary;
  ctx.fillText("페이지 (JS)", pad, 20);
  ctx.fillStyle = palette.muted;
  ctx.fillText("브라우저", l.split + 16, 20);

  ctx.strokeStyle = palette.border;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(l.split, 8);
  ctx.lineTo(l.split, height - 40);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(pad, 34);
  ctx.lineTo(width - pad, 34);
  ctx.stroke();

  // 연결선. 해당 단계가 켜질 때 함께 뻗어 나간다.
  const grow = (step: number) => reveal(step, elapsed);
  const line = palette.muted;
  const click = r("click");
  const dispatch = r("dispatch");
  const handler = r("handler");
  const sticky = r("sticky");
  const dialog = r("dialog");
  const cancel = r("cancel");
  const leave = r("leave");

  arrow(ctx, [[click.x + click.w / 2, click.y + click.h], [dispatch.x + dispatch.w / 2, dispatch.y]], line, grow(1));
  // 브라우저 → 페이지: 이벤트가 페이지로 넘어가는 유일한 순간
  arrow(
    ctx,
    [
      [dispatch.x, dispatch.y + dispatch.h / 2],
      [handler.x + handler.w / 2, dispatch.y + dispatch.h / 2],
      [handler.x + handler.w / 2, handler.y],
    ],
    palette.primary,
    grow(2),
  );
  // 페이지 → 브라우저: 돌려주는 건 막을지 말지(예/아니오) 하나뿐
  arrow(
    ctx,
    [
      [handler.x + handler.w / 2, handler.y + handler.h],
      [handler.x + handler.w / 2, sticky.y + sticky.h / 2],
      [sticky.x, sticky.y + sticky.h / 2],
    ],
    palette.primary,
    grow(3),
  );
  if (grow(3) >= 1) {
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = palette.primary;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("막을지만 전달", (handler.x + handler.w / 2 + sticky.x) / 2 + 6, sticky.y + sticky.h / 2 - 6);
  }
  arrow(ctx, [[sticky.x + sticky.w / 2, sticky.y + sticky.h], [dialog.x + dialog.w / 2, dialog.y]], line, grow(5));
  arrow(ctx, [[dialog.x + dialog.w / 2 - 20, dialog.y + dialog.h], [cancel.x + cancel.w / 2, cancel.y]], line, grow(6));
  arrow(ctx, [[dialog.x + dialog.w / 2 + 20, dialog.y + dialog.h], [leave.x + leave.w / 2, leave.y]], line, grow(6));

  for (const node of Object.values(NODES)) drawNode(ctx, node, l, palette, elapsed);

  // 다이얼로그가 떠 있는 동안 페이지 칸이 멈춰 있다는 표시
  const frozen = reveal(5, elapsed);
  if (frozen > 0) {
    const y = cy(4);
    ctx.globalAlpha = frozen;
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⏸  실행 멈춤", handler.x + handler.w / 2, y);
    ctx.globalAlpha = 1;
  }

  // 갈래 대신 한 줄 메모
  const note = reveal(7, elapsed);
  if (note > 0) {
    ctx.globalAlpha = note;
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      "막지 않았거나 클릭·탭·키 입력이 한 번도 없었으면 → 확인 없이 바로 나간다",
      pad,
      height - 12,
    );
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/**
 * 새로고침 한 번이 확인창까지 가는 길. 페이지 칸과 브라우저 칸을 나눠 그려서
 * 페이지가 관여하는 건 preventDefault() 한 칸뿐이라는 점이 구조로 보이게 한다.
 */
export function BeforeunloadFlowDemo() {
  return (
    <CanvasDemo
      caption="새로고침 한 번이 확인창까지 가는 길 — 누가 무엇을 정하나"
      height={TOP + ROW_GAP * 5 + 56}
      duration={DURATION}
      draw={draw}
    />
  );
}
