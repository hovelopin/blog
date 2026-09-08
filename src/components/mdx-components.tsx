import type { MDXComponents } from "mdx/types";
import { StreamingSsrDemo } from "@/components/demos/streaming-ssr-demo";
import { ProxyPathDemo } from "@/components/demos/proxy-path-demo";
import { TypeCostDemo } from "@/components/demos/type-cost-demo";
import { DelayRaceDemo } from "@/components/demos/delay-race-demo";
import { MemoryGrowthDemo } from "@/components/demos/memory-growth-demo";
import { GcResetDemo } from "@/components/demos/gc-reset-demo";
import { RecursionBlowupDemo } from "@/components/demos/recursion-blowup-demo";
import { PipelineDemo } from "@/components/demos/pipeline-demo";
import { EffectTimingDemo } from "@/components/demos/effect-timing-demo";
import { KeyUnionDemo } from "@/components/demos/key-union-demo";
import { ThrottleDemo } from "@/components/demos/throttle-demo";
import { AutocompleteDemo } from "@/components/demos/autocomplete-demo";
import { RevokeDemo } from "@/components/demos/revoke-demo";
import { StaleClosureDemo } from "@/components/demos/stale-closure-demo";
import { PrototypePollutionDemo } from "@/components/demos/prototype-pollution-demo";
import { GcBranchDemo } from "@/components/demos/gc-branch-demo";
import { CacheHitDemo } from "@/components/demos/cache-hit-demo";

/**
 * MDX 본문에서 import 없이 바로 쓸 수 있는 컴포넌트 목록.
 * 글에서는 `<StreamingSsrDemo />` 처럼 태그만 적으면 된다.
 */
export const mdxComponents: MDXComponents = {
  StreamingSsrDemo,
  ProxyPathDemo,
  TypeCostDemo,
  DelayRaceDemo,
  MemoryGrowthDemo,
  GcResetDemo,
  RecursionBlowupDemo,
  PipelineDemo,
  EffectTimingDemo,
  KeyUnionDemo,
  ThrottleDemo,
  AutocompleteDemo,
  RevokeDemo,
  StaleClosureDemo,
  PrototypePollutionDemo,
  GcBranchDemo,
  CacheHitDemo,
};
