---
title: "에러 복구: ErrorBoundaryGroup과 shouldCatch"
---

## 여러 경계를 한 번에 리셋

화면에 ErrorBoundary가 여러 개일 때, 하나씩 리셋하긴 번거롭습니다.
`ErrorBoundaryGroup`으로 묶으면 그룹 전체를 한 번에 되돌릴 수 있습니다.

```tsx
import { ErrorBoundaryGroup, useErrorBoundaryGroup } from "@suspensive/react";

function RetryAll() {
  const { reset } = useErrorBoundaryGroup();
  return <button onClick={reset}>전체 다시 시도</button>;
}

<ErrorBoundaryGroup>
  <RetryAll />
  <ErrorBoundary fallback={...}><A /></ErrorBoundary>
  <ErrorBoundary fallback={...}><B /></ErrorBoundary>
</ErrorBoundaryGroup>;
```

## shouldCatch: 잡을 에러 고르기

모든 에러를 이 경계가 삼키면 안 될 때가 있습니다. `shouldCatch`로 특정
에러만 잡고 나머지는 상위 경계로 흘려보냅니다.

```tsx
<ErrorBoundary
  shouldCatch={(error) => error instanceof NetworkError}
  fallback={<Retry />}
>
  <Feed />
</ErrorBoundary>
```

`resetKeys`에 값이 바뀌면 자동으로 경계를 리셋하는 것도 자주 쓰는 패턴입니다.
