import { createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { defineBlogDemo, registerDemo, type DemoProps, type DemoRenderer } from "@blog/ui";
import "./styles.css";
import { AutocompleteDemo } from "./demos/autocomplete-demo";
import { CacheHitDemo } from "./demos/cache-hit-demo";
import { DelayRaceDemo } from "./demos/delay-race-demo";
import { DtsBenchDemo } from "./demos/dts-bench-demo";
import { DuplicateReactDemo } from "./demos/duplicate-react-demo";
import { EffectTimingDemo } from "./demos/effect-timing-demo";
import { GcBranchDemo } from "./demos/gc-branch-demo";
import { GcResetDemo } from "./demos/gc-reset-demo";
import { KeyUnionDemo } from "./demos/key-union-demo";
import { MemoryGrowthDemo } from "./demos/memory-growth-demo";
import { ModuleGraphDemo } from "./demos/module-graph-demo";
import { PipelineDemo } from "./demos/pipeline-demo";
import { PrototypePollutionDemo } from "./demos/prototype-pollution-demo";
import { ProxyPathDemo } from "./demos/proxy-path-demo";
import { RecursionBlowupDemo } from "./demos/recursion-blowup-demo";
import { RevokeDemo } from "./demos/revoke-demo";
import { SideEffectsDemo } from "./demos/side-effects-demo";
import { StaleClosureDemo } from "./demos/stale-closure-demo";
import { StreamingSsrDemo } from "./demos/streaming-ssr-demo";
import { ThrottleDemo } from "./demos/throttle-demo";
import { TreeShakeDemo } from "./demos/tree-shake-demo";
import { TypeCostDemo } from "./demos/type-cost-demo";

/**
 * React 컴포넌트를 `<blog-demo>` 렌더러로 감싼다.
 * 컨테이너마다 독립된 루트를 만들고, 정리 함수에서 unmount 한다.
 * `<blog-demo>` 의 나머지 속성(preset 등)이 그대로 props 로 들어온다.
 */
function reactRenderer(Component: ComponentType<DemoProps>): DemoRenderer {
  return (container, props) => {
    const root = createRoot(container);
    root.render(createElement(Component, props));
    // 정리는 <blog-demo> 의 disconnectedCallback 에서 호출되는데, 그 시점은 호스트 React 가
    // 페이지를 커밋하는 중이다. 같은 React 인스턴스를 공유하므로 동기 unmount 는
    // "root while already rendering" 경고를 낸다. 한 틱 미뤄 호스트 커밋이 끝난 뒤 내린다.
    return () => {
      setTimeout(() => root.unmount(), 0);
    };
  };
}

/**
 * 이 리모트가 제공하는 데모 이름 → 컴포넌트.
 * 이름은 호스트의 mdx-components.tsx DEMO_TAGS 와 맞춘다.
 */
const demos: Record<string, ComponentType<DemoProps>> = {
  autocomplete: AutocompleteDemo,
  "cache-hit": CacheHitDemo,
  "delay-race": DelayRaceDemo,
  "dts-bench": DtsBenchDemo,
  "duplicate-react": DuplicateReactDemo,
  "effect-timing": EffectTimingDemo,
  "gc-branch": GcBranchDemo,
  "gc-reset": GcResetDemo,
  "key-union": KeyUnionDemo,
  "memory-growth": MemoryGrowthDemo,
  "module-graph": ModuleGraphDemo,
  pipeline: PipelineDemo as ComponentType<DemoProps>,
  "prototype-pollution": PrototypePollutionDemo,
  "proxy-path": ProxyPathDemo,
  "recursion-blowup": RecursionBlowupDemo,
  revoke: RevokeDemo,
  "side-effects": SideEffectsDemo,
  "stale-closure": StaleClosureDemo,
  "streaming-ssr": StreamingSsrDemo,
  throttle: ThrottleDemo,
  "tree-shake": TreeShakeDemo,
  "type-cost": TypeCostDemo,
};

defineBlogDemo();
for (const [name, Component] of Object.entries(demos)) {
  registerDemo(name, reactRenderer(Component));
}

export const registered = Object.keys(demos);
