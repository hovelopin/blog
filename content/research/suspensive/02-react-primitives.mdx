---
title: "@suspensive/react: 코어 프리미티브"
---

## Suspense: SSR까지 고려한 래퍼

`@suspensive/react`의 `Suspense`는 React의 `Suspense`를 감싸면서
`clientOnly` 옵션을 더한다. 서버에서는 fallback만 그리고, 클라이언트에서
실제 내용을 렌더해 하이드레이션 불일치를 피한다.

```tsx
import { Suspense } from "@suspensive/react";

<Suspense clientOnly fallback={<Skeleton />}>
  <Chart />
</Suspense>;
```

## Delay: 순간 깜빡임 방지

로딩이 아주 빠르면 스피너가 번쩍이고 사라져 오히려 거슬린다. `Delay`는
지정한 시간이 지나야 children을 보여준다.

```tsx
<Suspense fallback={<Delay ms={200}><Spinner /></Delay>}>
  <List />
</Suspense>
```

## ErrorBoundary와 ClientOnly

`ErrorBoundary`는 `fallback`에 에러와 `reset`을 넘겨주는 렌더 프롭을 받고,
`ClientOnly`는 브라우저에서만 렌더해야 하는 영역을 감싼다.

```tsx
<ErrorBoundary
  fallback={({ error, reset }) => (
    <button onClick={reset}>다시 시도 ({error.message})</button>
  )}
>
  <Widget />
</ErrorBoundary>
```
