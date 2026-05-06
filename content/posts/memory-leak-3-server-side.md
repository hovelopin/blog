---
title: "메모리 누수 해결을 위한 여정 - 서버사이드 편"
description: "제한된 힙 메모리 환경에서 부하 테스트를 돌려 서버사이드 메모리 누수의 직접 원인을 찾아낸 과정 — 결국 한 컴포넌트의 gcTime이 범인이었다."
date: "2025-11-03"
tags: ["nextjs", "performance", "memory", "tanstack-query"]
author: "hovelopin"
series: "메모리 누수 해결을 위한 여정"
seriesOrder: 3
---

[1편](/posts/memory-leak-1-image-cdn)에서 정적 리소스를 CDN으로 옮겨 서버 부하를 덜었고, [2편](/posts/memory-leak-2-client-rendering)에서 클라이언트측 누수 후보들을 정리했다. 그래도 운영 환경에서 메모리는 여전히 꾸준히 우상향하고 있었다. 이번 편에서는 **재현 환경을 만들고**, 그 안에서 실제 원인 한 점을 찾아낸 과정을 정리한다.

## 부하 테스트 환경 구성

메모리 누수를 의도적으로 재현하기 위해, 힙 메모리를 강제로 줄인 빌드 옵션을 추가했다.

```json
{
  "scripts": {
    "build": "next build",
    "start:memory-test": "NODE_OPTIONS='--max-old-space-size=128 --heapsnapshot-signal=SIGUSR2 --inspect' next start"
  }
}
```

- `--max-old-space-size=128` — 힙 메모리를 128MB로 제한
- `--heapsnapshot-signal=SIGUSR2` — `SIGUSR2`로 힙 스냅샷 트리거
- `--inspect` — 디버깅 모드 활성화

홈 화면이 누수의 시작점으로 의심됐기 때문에, 해당 페이지에 반복 요청을 쏘는 단순한 부하 테스트를 돌렸다.

```bash
for i in {1..500}; do curl http://localhost:3000/ko; done
```

정상 응답을 일정 횟수 반복하다가 특정 시점부터 터미널에 익숙한 에러가 떴다. 운영 서버에서 발생했던 것과 동일한 OOM 패턴이었다.

![OOM 에러 1](/imports/memory-leak-3-server-side/image-001.png)

![OOM 에러 2](/imports/memory-leak-3-server-side/image-003.png)

## 원인 좁히기

재현이 가능해졌으니 이진 탐색식으로 코드를 줄여나갔다. 정적인 로직은 그대로 두고, **의심되는 컴포넌트만 하나씩 빼면서** 어느 시점에 OOM이 사라지는지 확인했다.

그 결과 한 컴포넌트가 들어갈 때만 에러가 재현됐다.

![범인 컴포넌트 식별](/imports/memory-leak-3-server-side/image-007.png)

홈 화면 진입 시 노출되는 메인 팝업 컴포넌트였다.

![메인 팝업 컴포넌트](/imports/memory-leak-3-server-side/image-008.png)

코드를 들여다보니 TanStack Query로 데이터를 불러오는데, 옵션값이 다음과 같이 설정되어 있었다.

```ts
{
  staleTime: 12 * 60 * 60 * 1000, // 12시간
  gcTime: 24 * 60 * 60 * 1000,    // 24시간
}
```

옵션을 하나씩 제거하며 테스트했다.

- `staleTime`만 제거 → 여전히 OOM 발생
- `gcTime`까지 제거 → **정상 동작**

즉, 24시간으로 설정된 `gcTime`이 직접 원인이었다. 컴포넌트 단위에서 캐시가 사실상 영구 보관되며 메모리가 누적되고 있었다.

## 적용 결과

### Before

![Before — 누수 발생](/imports/memory-leak-3-server-side/image-009.png)

### After

![After — 측정 그래프 1](/imports/memory-leak-3-server-side/image-004.png)

![After — 측정 그래프 2](/imports/memory-leak-3-server-side/image-002.png)

[2편](/posts/memory-leak-2-client-rendering)에서 전역 `QueryClient`의 `gcTime`을 30분 → 5분으로 줄인 변경과 합쳐, 컴포넌트 단위에서 길게 잡혀 있던 옵션도 제거했다. 두 변경의 합으로 부하 테스트와 운영 환경 모두에서 메모리가 안정적으로 회수되는 것을 확인했다.

## 의문점 — gcTime은 트래픽이 클수록 더 위험하다

`gcTime`이 동작하는 원리는 다음과 같다.

1. 컴포넌트가 unmount → 해당 쿼리가 `inactive` 상태로 전환
2. 그 시점부터 `gcTime` 카운트다운 시작
3. 카운트다운 동안 동일한 요청이 들어오지 않으면 GC가 캐시를 회수

문제는 **카운트다운이 끝나기 전에 같은 요청이 들어오면 카운트다운이 다시 리셋**된다는 점이다. po 도메인의 일평균 접속자 수를 확인해 보니 일평균 2000회 전후로 측정됐다.

![도메인 트래픽 측정](/imports/memory-leak-3-server-side/image-006.png)

이 정도 트래픽에서도 24시간 `gcTime`이 직접 원인이 됐다는 건, **트래픽이 더 많은 대규모 서비스에서는 긴 `gcTime`을 절대 쓸 수 없다**는 뜻이기도 하다. 5분으로 줄인 지금 설정도 트래픽이 더 늘어난다면 다시 검토해야 할 항목이다.

캐시 옵션은 "성능을 위해 길게 잡는 것"이 아니라 **다음 GC 시점에 진짜 회수가 일어날 수 있는 길이**여야 한다. 이 시리즈는 여기서 마친다.
