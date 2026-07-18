---
title: "왜 Suspensive인가: isLoading 지옥에서 벗어나기"
---

## 분기가 컴포넌트를 오염시킨다

비동기 데이터를 다루는 흔한 코드는 이렇게 생겼다.

```tsx
function UserProfile() {
  const { data, isLoading, isError } = useUser();
  if (isLoading) return <Spinner />;
  if (isError) return <ErrorText />;
  return <Profile user={data} />; // 여기서야 data가 확정된다
}
```

성공 렌더링 한 줄을 위해 로딩·에러 분기가 늘 따라붙는다. 컴포넌트가
쌓일수록 이 분기도 함께 번지고, `data`가 `undefined`일 가능성 때문에
타입도 계속 좁혀야 한다.

## Suspense는 이 분기를 "경계"로 옮긴다

React Suspense는 로딩 상태를, ErrorBoundary는 에러 상태를 컴포넌트 바깥의
**경계(boundary)**로 끌어올린다. 데이터를 쓰는 컴포넌트는 성공한 경우만
가정하면 된다.

```tsx
<ErrorBoundary fallback={<ErrorText />}>
  <Suspense fallback={<Spinner />}>
    <UserProfile /> {/* data는 항상 존재한다고 가정 */}
  </Suspense>
</ErrorBoundary>
```

Suspensive는 이 패턴을 SSR·기본값·중첩 문제까지 다듬어 실전에서 바로
쓸 수 있게 만든 도구 모음이다.
