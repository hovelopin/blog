/**
 * 데모 렌더러 레지스트리.
 *
 * 호스트와 리모트는 이 패키지를 각자 번들에 들고 있을 수 있다. 그래도 같은
 * 레지스트리를 봐야 하므로 모듈 스코프가 아니라 `globalThis` 심볼 아래에 둔다.
 * 리모트가 `registerDemo()` 로 렌더러를 넣고, `<blog-demo>` 가 꺼내 쓴다.
 */

/** 렌더러는 컨테이너에 그리고, 정리 함수를 돌려준다. */
export type DemoRenderer = (container: HTMLElement, props: DemoProps) => () => void;

export type DemoProps = Readonly<Record<string, string>>;

interface Registry {
  renderers: Map<string, DemoRenderer>;
  waiters: Map<string, Set<() => void>>;
}

const KEY = Symbol.for("blog.demo-registry");

function getRegistry(): Registry {
  const g = globalThis as typeof globalThis & { [KEY]?: Registry };
  g[KEY] ??= { renderers: new Map(), waiters: new Map() };
  return g[KEY];
}

export function registerDemo(name: string, renderer: DemoRenderer): void {
  const reg = getRegistry();
  reg.renderers.set(name, renderer);
  const waiting = reg.waiters.get(name);
  if (!waiting) return;
  reg.waiters.delete(name);
  for (const wake of waiting) wake();
}

export function getDemoRenderer(name: string): DemoRenderer | undefined {
  return getRegistry().renderers.get(name);
}

/** 렌더러가 등록될 때까지 기다린다. 이미 있으면 즉시 resolve. */
export function waitForDemo(name: string, signal?: AbortSignal): Promise<DemoRenderer> {
  const reg = getRegistry();
  const existing = reg.renderers.get(name);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const wake = () => {
      signal?.removeEventListener("abort", onAbort);
      const r = reg.renderers.get(name);
      if (r) resolve(r);
    };
    const onAbort = () => {
      reg.waiters.get(name)?.delete(wake);
      reject(new DOMException("aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    const set = reg.waiters.get(name) ?? new Set();
    set.add(wake);
    reg.waiters.set(name, set);
  });
}
