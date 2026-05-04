---
title: "App Router 캐싱 모델 — 1편: fetch의 동작을 다시 읽기"
description: "Next.js 16의 fetch 캐싱이 opt-in으로 돌아오면서 다시 한 번 정리해야 했던 것들."
date: "2026-04-22"
tags: ["nextjs", "caching", "react"]
author: "hovelopin"
series: "App Router 캐싱 모델 깊게 보기"
seriesOrder: 1
---

App Router의 캐싱은 익숙해졌다고 생각할 때쯤 또 바뀐다. 16에서 한 번 더 정리해야 했다. 이 시리즈는 `fetch` → `use cache` → revalidation 순으로 내가 이해한 그림을 글로 옮긴 것이다.

## 기본값이 바뀌었다

15까지의 기본은 강제 캐시(`force-cache`)였다. 모르는 사이에 캐시되고, 모르는 사이에 stale한 데이터가 흘러나왔다.

16에서는 반대다. `fetch`는 기본적으로 캐시되지 않는다.

```ts
// 16: 매 요청마다 origin으로 간다
const res = await fetch("/api/posts");

// 캐시하고 싶으면 명시적으로
const res = await fetch("/api/posts", {
  next: { revalidate: 3600 },
});
```

암묵적인 캐시가 사라진 건 환영이다. 캐싱은 명시적으로, 그리고 의도적으로.

## 캐시 키는 무엇인가

`fetch`의 캐시 키는 URL + 메서드 + 본문 + 헤더의 일부다. 같은 URL이라도 헤더가 달라지면 다른 키다. 무심코 `Authorization`을 붙이면 유저별로 캐시가 갈라진다.

요약: 공유 가능한 캐시는 공유 가능한 입력에서만 나온다.

## 다음 편

다음 편에서는 `fetch`로 묶이지 않는 임의의 함수를 캐시하는 방법, 즉 `"use cache"` 지시어를 본다.
