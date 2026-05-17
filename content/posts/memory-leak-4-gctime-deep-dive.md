---
title: "메모리 누수 해결을 위한 여정 - gcTime 한 줄이 SSR을 죽인 진짜 이유"
description: "3편에서 범인으로 지목된 gcTime: 24h. 그런데 정말 '캐시가 24시간 살아 있어서' 누수가 났을까? TanStack Query 소스 두 파일을 열어 SSR 분기의 실제 메커니즘을 따라간 기록."
date: "2026-05-16"
tags: ["nextjs", "performance", "memory", "tanstack-query", "ssr"]
author: "hovelopin"
series: "메모리 누수 해결을 위한 여정"
seriesOrder: 4
---

[3편](/posts/memory-leak-3-server-side)에서 메인 팝업 컴포넌트의 `gcTime: 24h` 한 줄이 서버 OOM의 직접 원인임을 확인하고 시리즈를 마무리했었다. 결론은 분명했지만, 글을 올린 뒤에도 한 가지 질문이 계속 남았다.

> "왜 클라이언트에서는 같은 옵션이 문제를 일으키지 않았을까?"

이 질문의 답을 찾기 위해 가벼운 마음으로 재현 레포(`gctime-oom`)를 따로 만들었는데, 결과적으로 처음 3편에서 내가 설명했던 **메커니즘 자체가 절반쯤 틀렸다는 사실**을 알게 됐다. 이번 편은 그 정정 기록이자, TanStack Query 소스 두 파일로 추적한 SSR `gcTime` 누수의 정확한 동작에 대한 글이다.

---

## 1. 재현 환경 — 더 가혹하게

3편에서 사용했던 부하 테스트(`--max-old-space-size=128`, 500회 요청)를 그대로 가져와 한도를 더 조였다.

- Next.js 16 + React 19 + TanStack Query v5 + next-intl
- `next build && next start` (production)
- `NODE_OPTIONS='--max-old-space-size=64'` — 절반인 64MB로 축소
- `for i in {1..500}; do curl http://localhost:3000/ko; done`

결과는 **209번째 요청에서 `FATAL ERROR: Ineffective mark-compacts near heap limit`** 으로 프로세스 사망. 3편의 패턴이 더 작은 힙에서 그대로 재현됐다.

그리고 `useUsers` 훅에서 `gcTime: 24h` 한 줄만 지우면, 같은 부하에서 500/500 정상 처리. RSS는 plateau를 찍은 뒤 자발적으로 회수된다.

```
[mem] t=0s  rss=164MB
[mem] t=1s  rss=184MB
[curl] progress req=200 ok=200
<--- Last few GCs --->
46463 ms: Mark-Compact (reduce) 62.4 → 61.9 MB
46479 ms: Mark-Compact (reduce) 62.9 → 61.9 MB
FATAL ERROR: Ineffective mark-compacts near heap limit
[curl] req=210 transport_failure rc=52
```

`gcTime` 라인을 제거한 뒤:

```
[mem] t=0s  rss=165MB
[mem] t=4s  rss=217MB  peak=217MB     ← 200req
[mem] t=9s  rss=193MB  delta=-24MB    ← GC가 24MB 회수!
[mem] t=10s rss=187MB                  ← 500req 완주
[curl] done ok=500 bad=0 transport_fail=0
```

같은 부하, 같은 한도, 결과는 정반대. 한 줄이 모든 차이를 만든다.

---

## 2. 3편에서 내가 했던 설명 — 어디가 틀렸나

3편에서 나는 이렇게 적었다.

> 컴포넌트가 unmount → 쿼리가 inactive로 전환 → `gcTime` 카운트다운 시작 → 카운트다운 안에 같은 요청이 들어오면 리셋 → 트래픽이 많을수록 회수가 안 됨.

이 설명은 **클라이언트 관점에서는 맞다.** 그런데 우리가 본 OOM은 클라이언트가 아니라 SSR 서버에서 발생했고, 서버에서는 매 요청마다 새 `QueryClient`가 생성된다. "컴포넌트 unmount"라는 개념 자체가 적용되지 않는다. 즉, 3편의 설명은 증상을 맞췄지만 **메커니즘을 잘못 짚었다.**

이 점은 글을 본 동료가 한 줄로 정확히 지적해줬다.

> "내가 알기로는 설정을 안 하면 `gcTime` 기본값이 Infinity 아니야?"

곧장 라이브러리 소스를 열었다.

---

## 3. 진짜 메커니즘 — TanStack Query 소스 두 곳

### 3.1 server default는 Infinity다

[`@tanstack/query-core/src/removable.ts`](https://github.com/TanStack/query/blob/v5.90.6/packages/query-core/src/removable.ts) L23-29:

```ts
protected updateGcTime(newGcTime: number | undefined): void {
  // Default to 5 minutes (Infinity for server-side) if no gcTime is set
  this.gcTime = Math.max(
    this.gcTime || 0,
    newGcTime ?? (isServer ? Infinity : 5 * 60 * 1000),
  )
}
```

**클라이언트 default는 5분, 서버 default는 Infinity.** 주석까지 친절하게 적혀 있다.

### 3.2 Infinity면 timer가 등록되지 않는다

같은 파일 L13-21:

```ts
protected scheduleGc(): void {
  this.clearGcTimeout()
  if (isValidTimeout(this.gcTime)) {                  // ← gate
    this.#gcTimeout = timeoutManager.setTimeout(() => {
      this.optionalRemove()
    }, this.gcTime)
  }
}
```

[`utils.ts`](https://github.com/TanStack/query/blob/v5.90.6/packages/query-core/src/utils.ts#L93-L95) L93-95:

```ts
export function isValidTimeout(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value !== Infinity
}
```

세 줄로 이어 읽으면:

1. `useQuery` 옵션에 `gcTime`을 안 주면 server에서는 `Infinity`.
2. `isValidTimeout(Infinity)`는 **false**.
3. 따라서 `scheduleGc()`의 `if`가 거짓 → **`setTimeout` 호출 자체를 skip**.

즉, server에서는 timer가 **아예 등록되지 않는다.** cache를 reachable로 잡는 외부 참조가 없으니, request가 끝나면 `QueryClient`는 즉시 unreachable이 되어 GC 가능. 이게 TanStack이 의도한 SSR-friendly한 default다.

### 3.3 `gcTime: 24h`가 이 SSR 분기를 깨뜨린다

| `gcTime` 옵션 | server측 `this.gcTime` | `isValidTimeout` | timer 등록 | cache 잡힘 |
|---|---|---|---|---|
| 명시 안 함 | `Infinity` | **false** | **안 됨** | 없음 |
| `0` | `0` | true | 즉시 fire | 매우 짧게 |
| `5 * 60 * 1000` | `5min` | true | 5분 timer | 5분간 |
| **`24h`** (3편의 코드) | **`24h`** | **true** | **24h timer** | **24시간** |

명시값이 default 분기보다 우선이라, server-side default `Infinity`가 깨지고 `setTimeout(24h)`가 등록된다. 이 timer의 콜백이 클로저로 `Query → QueryCache → QueryClient`를 통째로 잡아 24시간 동안 reachable로 유지한다.

요청 1회 = `QueryClient` 1개 + 24h 짜리 timer 1개. 요청이 누적되면 timer도 누적되고, timer가 잡고 있는 `QueryClient`들도 누적된다. 64MB old-space에 200개 정도 쌓이면 한도 초과.

### 3.4 V8이 회수하지 못하는 이유

24시간처럼 매우 긴 timer는 V8이 long-lived로 판단해 old generation으로 promote한다. major(Mark-Compact) GC만이 회수 시도가 가능한데, timer가 reachable이라 회수 실패 → "Ineffective mark-compacts near heap limit" → fatal.

반대로 `gcTime`을 안 주면 timer 자체가 없으니, request가 끝나면 `QueryClient`가 즉시 unreachable이 되어 minor GC(scavenge)로도 자주 회수된다. 위 실험에서 본 217 → 187MB 자발 회수가 그 결과다.

---

## 4. 흔한 오해 정리 — 3편 독자에게 보내는 정정

3편에서 내가 남긴 (그리고 많은 글이 반복하는) 설명은 이렇다.

> "`gcTime` 제거 = default 5분 → 5분 후에 회수돼서 살아난다"

**틀렸다.** client default만 5분이고 server default는 Infinity. 그리고 누수가 끊긴 진짜 이유는 "5분 후 timer가 fire돼서"가 아니라 **"timer 자체가 등록되지 않아서"** 다.

증거: 위 실험에서 RSS가 5분 timer를 기다릴 필요 없이 burst가 끝난 직후(10초 안)에 217 → 187MB로 떨어졌다. 애초에 기다릴 timer가 없었으니 가능한 회수다.

---

## 5. 그래서 — 라이브러리 버그인가?

**아니다.** 이건 알려진 footgun에 가깝다.

검색해 보니 정확히 같은 패턴이 커뮤니티에서 여러 번 보고됐다.

- [TanStack/query #8136 — `gcTime is not working with SSR, but it works well with CSR`](https://github.com/TanStack/query/issues/8136) — server default Infinity가 의도된 동작임을 메인테이너가 확인.
- [TanStack/query Discussion #3284 — `SSR and high memory consumption`](https://github.com/TanStack/query/discussions/3284) — per-request `QueryClient` + 유한 `gcTime` = 누수, `cacheTime: 0` 권장.
- [TanStack/router #7402 — `SSR memory leak under sustained load`](https://github.com/tanstack/router/issues/7402) — autocannon 5분 / 50 concurrent 부하 시 33MB → 2.4GB로 폭증, `gcTime: 0` 적용 시 plateau. 본 분석과 동일 결론.
- [vercel/next.js Discussion #77542](https://github.com/vercel/next.js/discussions/77542) — Next.js 15 / React 19 환경에서도 동일 패턴 보고.

또 [TanStack Query 공식 SSR 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)에는 다음 문구가 박혀 있다.

> If you are explicitly setting a non-Infinity `gcTime` then you will be responsible for clearing the cache early, and you can add a call to `queryClient.clear()` after the request is handled and dehydrated state has been sent to the client.

한 가지 중요한 사실은, TanStack Query **v3 시절에는 server default도 5분이었다**는 것이다. 그때부터 동일 누수가 보고됐고, **v4에서 server default를 Infinity로 바꿔 라이브러리 차원에서 fix**됐다. 우리가 본 누수는 사용자가 그 fix를 명시값으로 덮어 쓸 때만 재현된다.

| 측면 | 평가 |
|---|---|
| 라이브러리 버그? | **No** — 명시값을 존중하는 동작은 API 계약상 정상. v4 이후 default는 SSR-safe. |
| 라이브러리 sharp edge? | **Yes** — dev warning도, server cap도 없음. 같은 패턴이 2022년부터 반복 보고. |
| 공식 문서에 명시? | **Yes** — `queryClient.clear()` 호출이 사용자 책임. 단, 강조도가 약함. |
| 사용자 코드 1차 책임? | **Yes** — SSR에서 도는 query에 hooks 단에서 유한 `gcTime` 명시 + `clear()` 누락. |

---

## 6. 어떻게 고치나

3편에서는 "옵션을 제거한다"로 정리하고 끝냈지만, 실제로는 선택지가 더 있다. 우선순위 순.

### 6.1 가장 단순한 fix — hooks 단에서 `gcTime` 빼기

```ts
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: api.getUsers,
    staleTime: 60 * 1000 * 60 * 12,
    // gcTime 명시 X → server: Infinity (timer 미등록), client: 5min default
  })
}
```

### 6.2 클라이언트 캐시는 길게 두고 싶다면 — `makeQueryClient`에서 분기

```ts
import { isServer } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 12 * 60 * 60 * 1000,
        gcTime: isServer ? Infinity : 24 * 60 * 60 * 1000,  // server: timer 미등록
      },
    },
  })
}
```

이러면 hooks 단에서 굳이 옵션을 안 줘도 client만 24h가 적용되고, server는 leak-free.

### 6.3 가장 정석 — `prefetchQuery` + `<HydrationBoundary>`

`useUsers()`를 client component에서 직접 호출하지 말고, server component에서 prefetch → dehydrate → client에서 hydrate하는 패턴으로 전환. 서버 cache lifecycle이 요청 스코프와 일치해, 누수 가능성 자체가 사라진다.

---

## 7. 디버깅 회고 — 한 줄로 OOM이 나는 시스템

이번 추적에서 다시 한 번 정리하게 된 것들.

1. **"메모리 회수가 안 되는" 신호는 V8이 친절히 알려준다.** "Ineffective mark-compacts near heap limit"는 단순 OOM이 아니라 **reachable leak**이라는 강한 힌트다. 회수 가능한 garbage가 충분했다면 정상 GC로 처리됐을 것.
2. **timer의 길이보다 timer의 *존재 여부*가 중요할 수 있다.** Node에서는 `setTimeout` 콜백이 클로저로 잡은 모든 것이 fire 또는 `clearTimeout`까지 reachable. 라이브러리가 default로 timer를 안 만드는 데에는 이유가 있다.
3. **default는 라이브러리 작성자의 의도다.** 명시값으로 덮을 땐, 그 default가 어떤 시나리오를 보호하고 있었는지 한 번 확인하자. SSR-safe default를 일반 옵션 한 줄로 깨는 건 흔한 footgun.
4. **추측보다 소스.** "5분 default라서 회수된다"는 그럴듯한 추측이었지만 틀렸다. 라이브러리 코드 두 파일(`removable.ts`, `utils.ts`)을 직접 읽고서야 정확한 메커니즘이 잡혔다. 3편을 쓸 때의 나는 이 단계를 생략했고, 그래서 결과는 맞췄지만 원리는 절반쯤 비껴 갔다.
5. **Before/After 비교 + 정량 데이터로 확정.** `gcTime` 한 줄을 빼고 같은 부하를 다시 돌려 RSS가 plateau → 회수되는 것까지 확인하니 가설이 사실로 굳어졌다. "고쳐 보고 같은 증상이 사라지는지"가 원인 분석의 마지막 증거.

---

## 8. 한 줄 결론

> server SSR마다 새 `QueryClient`가 생성되는 건 정상 패턴이다.
> 문제는 `useUsers`의 `gcTime: 24h`가 TanStack Query의 SSR-friendly한 server default(`Infinity` → timer 미등록)를 덮어써서, server에서도 `setTimeout(24h)`가 매 요청 등록되고 그 timer가 `QueryClient`를 24시간 reachable로 잡는 것.
> hooks 단에서 `gcTime`을 명시하지 않으면, `isValidTimeout(Infinity) === false` 분기로 timer 자체가 만들어지지 않아 누수가 사라진다.

라이브러리 한 옵션, 라이브러리 한 default, 라이브러리 한 가드 함수. 셋이 만나는 지점에서 production OOM이 나왔다. 3편에서 시리즈를 끝낸 줄 알았지만, **"왜 클라이언트에서는 멀쩡한가"** 라는 질문 하나가 한 편을 더 만들었다. SSR 환경에서 fetching 라이브러리를 쓸 땐, default를 덮을 때마다 한 번 더 의심해보자.

---

## 참고

- [TanStack Query — Server Rendering & Hydration 공식 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [`@tanstack/query-core/src/removable.ts` (v5.90.6)](https://github.com/TanStack/query/blob/v5.90.6/packages/query-core/src/removable.ts)
- [`@tanstack/query-core/src/utils.ts` (v5.90.6)](https://github.com/TanStack/query/blob/v5.90.6/packages/query-core/src/utils.ts#L93-L95)
- [TanStack/query #8136 — gcTime is not working with SSR](https://github.com/TanStack/query/issues/8136)
- [TanStack/query Discussion #3284 — SSR and high memory consumption](https://github.com/TanStack/query/discussions/3284)
- [TanStack/router #7402 — SSR memory leak under sustained load](https://github.com/tanstack/router/issues/7402)
- [vercel/next.js Discussion #77542 — Memory leak when instantiating QueryClient per call](https://github.com/vercel/next.js/discussions/77542)
