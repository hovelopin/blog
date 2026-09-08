"use client";

import { CanvasDemo, type DrawArgs } from "@/components/demos/canvas-demo";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const STEP_MS = 1300;

interface Stage {
  title: string;
  detail: string;
  /** 위험(공격 진행 등)한 단계는 붉게 칠한다. */
  danger?: boolean;
  /** 사람이 개입해 승인하는 단계 */
  gate?: boolean;
}

interface Preset {
  caption: string;
  stages: Stage[];
}

const PRESETS: Record<string, Preset> = {
  // react-cve-2025-55182 — PoC 가 밟는 공격 체인
  rce: {
    caption: "CVE-2025-55182 공격 체인 — 요청 하나가 명령 실행까지 가는 경로",
    stages: [
      { title: "조작된 JSON", detail: "공격자가 페이로드 전송", danger: true },
      { title: "프로토타입 오염", detail: "서버측 객체 프로토타입 변조", danger: true },
      { title: "코드 주입", detail: "오염된 프로토타입으로 임의 JS 실행", danger: true },
      { title: "명령 실행", detail: "child_process.execSync()", danger: true },
      { title: "결과 반환", detail: "에러 메시지에 실려 공격자에게", danger: true },
    ],
  },
  // jira-fixer-automation — 승인을 두 번 받는 워크플로
  jira: {
    caption: "jira-fixer 워크플로 — 사람이 두 번 끊어준다",
    stages: [
      { title: "이슈 수집", detail: "Jira MCP 로 티켓·첨부 읽기" },
      { title: "작업 계획", detail: "고칠 파일과 줄까지 제시" },
      { title: "승인 ①", detail: "사용자가 계획을 확인", gate: true },
      { title: "코드 수정", detail: "브랜치에 변경 적용" },
      { title: "댓글 초안", detail: "Jira 에 남길 문구 작성" },
      { title: "승인 ②", detail: "게시 전 마지막 확인", gate: true },
    ],
  },
  // jira-fixer-automation — 자동화 이전의 손작업
  jiraManual: {
    caption: "자동화 전 — 사람이 시스템 사이를 오가며 옮겨 적던 단계",
    stages: [
      { title: "이슈 확인", detail: "Jira 에서 티켓을 읽는다" },
      { title: "첨부 확인", detail: "댓글·Figma 를 따로 연다" },
      { title: "요구사항 정리", detail: "머릿속에서 한 번 더 정리", danger: true },
      { title: "프롬프트 작성", detail: "LLM 채팅창에 옮겨 적는다", danger: true },
      { title: "코드 수정", detail: "결과를 받아 반영" },
      { title: "댓글 옮겨 적기", detail: "다시 Jira 양식으로 정리", danger: true },
    ],
  },
  // claude-figma-mcp — 디자인에서 코드까지
  figma: {
    caption: "Figma 링크 하나로 코드까지 — MCP 가 이어주는 단계",
    stages: [
      { title: "링크 복사", detail: "Figma 프레임 URL" },
      { title: "MCP 조회", detail: "노드 트리·토큰·이미지 추출" },
      { title: "코드 생성", detail: "컴포넌트와 스타일로 변환" },
      { title: "대조", detail: "원본 디자인과 눈으로 비교" },
    ],
  },
  // cursor-webpage-to-figma — 반대 방향
  toFigma: {
    caption: "웹페이지를 Figma 로 — 반대 방향 파이프라인",
    stages: [
      { title: "페이지 수집", detail: "DOM·스타일·에셋 긁기" },
      { title: "구조 해석", detail: "레이아웃을 프레임으로 매핑" },
      { title: "Figma 생성", detail: "플러그인 API 로 노드 작성" },
      { title: "손보기", detail: "간격·폰트 정리" },
    ],
  },
  // memory-leak-1 — 이미지 요청이 서버 메모리를 잡아먹던 경로와 CDN 이관
  cdn: {
    caption: "정적 리소스 요청 경로 — Next 서버가 안고 있던 것을 CDN 으로 넘긴다",
    stages: [
      { title: "이미지 요청", detail: "next/image 최적화 엔드포인트로 들어온다" },
      { title: "서버에서 변환", detail: "리사이즈·포맷 변환을 서버가 직접 수행", danger: true },
      { title: "서버 캐시 적재", detail: "결과물이 서버 메모리·디스크에 쌓인다", danger: true },
      { title: "CDN 으로 이관", detail: "정적 파일은 CDN 이 받아 서버 부담을 덜어낸다" },
    ],
  },

  // react-cve-2026-23869 — 요청 하나로 서버를 멈추는 경로
  dos: {
    caption: "CVE-2026-23869 — 페이로드 하나가 CPU 를 붙잡기까지",
    stages: [
      { title: "Map 페이로드", detail: "Flight 스트림에 조작된 Map 모델", danger: true },
      { title: "역직렬화 시작", detail: "createMap 이 가드를 통과", danger: true },
      { title: "이터레이터 재진입", detail: "new Map(model) 이 동기로 되돈다", danger: true },
      { title: "무한 재귀", detail: "가드가 다시 통과되며 스택이 쌓인다", danger: true },
      { title: "서버 정지", detail: "CPU 100% · 다른 요청도 함께 막힌다", danger: true },
    ],
  },
  // i18next-typescript-setup — 설정 의존에서 타입 기반으로
  i18nTypes: {
    caption: "번역 key 검증이 에디터 설정에서 프로젝트 타입으로 옮겨가는 경로",
    stages: [
      { title: "JSON 리소스", detail: "번역 파일은 그대로 둔다" },
      { title: "타입으로 읽기", detail: "resources 를 값으로 import" },
      { title: "CustomTypeOptions", detail: "i18next 모듈에 타입 등록" },
      { title: "컴파일 검증", detail: "오타·삭제된 키가 빌드에서 걸린다" },
    ],
  },
  // i18next-selector-runtime — selector 가 문자열 키가 되기까지
  selectorRuntime: {
    caption: "selector 함수가 기존 번역 엔진에 닿기까지",
    stages: [
      { title: "useTranslation", detail: "namespace·언어를 확보" },
      { title: "getFixedT", detail: "이 컴포넌트 전용 t 를 만든다" },
      { title: "keysFromSelector", detail: "함수라면 Proxy 를 넣어 실행" },
      { title: "경로 기록", detail: "get 트랩이 키를 배열에 쌓는다" },
      { title: "문자열 키", detail: "PATH_KEY 로 회수해 결합" },
      { title: "Translator", detail: "여기서부터는 기존 i18next 와 같다" },
    ],
  },

  // playwright-mcp-shadcn-design-system
  designSystem: {
    caption: "Playwright MCP 로 실제 화면을 보며 디자인 시스템을 맞춰가는 흐름",
    stages: [
      { title: "화면 열기", detail: "Playwright MCP 로 실제 렌더 확인" },
      { title: "차이 수집", detail: "간격·색·타이포 어긋난 곳 기록" },
      { title: "토큰 수정", detail: "shadcn 변수·컴포넌트 조정" },
      { title: "재확인", detail: "다시 열어 눈으로 검증" },
    ],
  },
};

function makeDraw(preset: Preset) {
  const n = preset.stages.length;
  return ({ ctx, width, height, elapsed, palette }: DrawArgs) => {
    const pad = 14;
    const active = Math.min(n - 1, Math.floor(elapsed / STEP_MS));
    const local = (elapsed % STEP_MS) / STEP_MS;

    const rowH = (height - pad * 2) / n;
    const boxH = Math.min(34, rowH - 8);
    const numW = 26;

    ctx.textBaseline = "middle";

    preset.stages.forEach((s, i) => {
      const y = pad + i * rowH + (rowH - boxH) / 2;
      const done = i < active;
      const now = i === active;
      const alpha = done ? 1 : now ? Math.min(1, local * 2.5) : 0.22;
      const color = s.danger ? palette.danger : s.gate ? palette.warn : palette.primary;

      // 연결선
      if (i > 0) {
        ctx.strokeStyle = palette.border;
        ctx.globalAlpha = i <= active ? 0.8 : 0.3;
        ctx.beginPath();
        ctx.moveTo(pad + numW / 2, y - (rowH - boxH) / 2 - 2);
        ctx.lineTo(pad + numW / 2, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 단계 번호 원
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pad + numW / 2, y + boxH / 2, 9, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.18;
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.font = `600 10px ${MONO}`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), pad + numW / 2, y + boxH / 2 + 0.5);

      // 제목 + 설명
      ctx.textAlign = "left";
      ctx.font = `600 12px ${MONO}`;
      ctx.fillStyle = palette.fg;
      ctx.fillText(s.title, pad + numW + 10, y + boxH / 2 - 7);
      ctx.font = `10px ${MONO}`;
      ctx.fillStyle = palette.muted;
      ctx.fillText(s.detail, pad + numW + 10, y + boxH / 2 + 8);

      if (s.gate && i <= active) {
        ctx.font = `9px ${MONO}`;
        ctx.fillStyle = palette.warn;
        ctx.textAlign = "right";
        ctx.fillText("사람이 확인", width - pad, y + boxH / 2);
        ctx.textAlign = "left";
      }
      ctx.globalAlpha = 1;
    });

    ctx.textBaseline = "alphabetic";
  };
}

/** 단계가 순서대로 진행되는 흐름을 보여준다. 글마다 preset 으로 내용을 갈아 끼운다. */
export function PipelineDemo({ preset = "jira" }: { preset?: keyof typeof PRESETS }) {
  const p = PRESETS[preset] ?? PRESETS.jira;
  return (
    <CanvasDemo
      caption={p.caption}
      height={p.stages.length * 46 + 16}
      duration={STEP_MS * (p.stages.length + 1)}
      draw={makeDraw(p)}
    />
  );
}
