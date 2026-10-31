import type { MDXComponents } from "mdx/types";

/**
 * MDX 본문에서 `<StaleClosureDemo />` 처럼 쓰는 데모 태그 → `<blog-demo name>`.
 *
 * 글은 데모가 어디서 오는지 모른다. 호스트는 태그 이름과 자리 높이만 알고,
 * 실제 구현은 리모트가 `registerDemo()` 로 끼워 넣는다.
 * minHeight 는 캔버스 높이 + 카드 여백(48px)으로, 리모트가 그리기 전 레이아웃 이동을 막는다.
 * 두 레인을 쌓는(stackable) 데모는 넓은 화면 기준 높이만 잡는다.
 */
const DEMO_TAGS: Record<string, { name: string; minHeight: number }> = {
  AutocompleteDemo: { name: "autocomplete", minHeight: 238 },
  CacheHitDemo: { name: "cache-hit", minHeight: 234 },
  DelayRaceDemo: { name: "delay-race", minHeight: 216 },
  DtsBenchDemo: { name: "dts-bench", minHeight: 234 },
  DuplicateReactDemo: { name: "duplicate-react", minHeight: 244 },
  EffectTimingDemo: { name: "effect-timing", minHeight: 248 },
  GcBranchDemo: { name: "gc-branch", minHeight: 270 },
  GcResetDemo: { name: "gc-reset", minHeight: 244 },
  KeyUnionDemo: { name: "key-union", minHeight: 258 },
  MemoryGrowthDemo: { name: "memory-growth", minHeight: 258 },
  ModuleGraphDemo: { name: "module-graph", minHeight: 248 },
  // 단계 수(preset)에 따라 높이가 달라진다. 가장 흔한 4~5단계 기준.
  PipelineDemo: { name: "pipeline", minHeight: 250 },
  PrototypePollutionDemo: { name: "prototype-pollution", minHeight: 270 },
  ProxyPathDemo: { name: "proxy-path", minHeight: 244 },
  RecursionBlowupDemo: { name: "recursion-blowup", minHeight: 300 },
  RevokeDemo: { name: "revoke", minHeight: 244 },
  SideEffectsDemo: { name: "side-effects", minHeight: 218 },
  StaleClosureDemo: { name: "stale-closure", minHeight: 244 },
  StreamingSsrDemo: { name: "streaming-ssr", minHeight: 298 },
  ThrottleDemo: { name: "throttle", minHeight: 262 },
  TreeShakeDemo: { name: "tree-shake", minHeight: 206 },
  TypeCostDemo: { name: "type-cost", minHeight: 216 },
};

/**
 * 데모 태그의 props(`preset="figma"` 등)는 커스텀 엘리먼트 속성으로 넘긴다.
 * `<blog-demo>` 가 name·min-height 를 뺀 나머지 속성을 렌더러 props 로 전달한다.
 */
function toAttributes(props: Record<string, unknown>): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "children" || value === undefined || value === null) continue;
    attrs[key.toLowerCase()] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return attrs;
}

function demoComponents(): MDXComponents {
  const out: MDXComponents = {};
  for (const [tag, { name, minHeight }] of Object.entries(DEMO_TAGS)) {
    out[tag] = (props: Record<string, unknown>) => (
      <blog-demo name={name} min-height={minHeight} {...toAttributes(props)} />
    );
  }
  return out;
}

export const mdxComponents: MDXComponents = {
  ...demoComponents(),
};
