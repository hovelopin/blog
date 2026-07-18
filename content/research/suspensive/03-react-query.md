---
title: "@suspensive/react-query: 선언적 데이터 패칭"
---

## 훅 대신 컴포넌트로

`SuspenseQuery`는 `useSuspenseQuery`를 컴포넌트로 감싸, 쿼리를 JSX 트리 안에서
선언하게 해준다. 데이터를 쓰는 지점과 Suspense 경계가 자연스럽게 가까워진다.

```tsx
import { SuspenseQuery } from "@suspensive/react-query";

<Suspense fallback={<Skeleton />}>
  <SuspenseQuery queryKey={["user", id]} queryFn={() => fetchUser(id)}>
    {({ data: user }) => <Profile user={user} />}
  </SuspenseQuery>
</Suspense>;
```

## 병렬 패칭과 리렌더 범위 축소

여러 쿼리를 나란히 두면 워터폴 없이 병렬로 요청된다. 각 `SuspenseQuery`가
자기 데이터만 구독하므로, 한 쿼리가 갱신돼도 리렌더가 그 하위로만 좁혀진다.

```tsx
<SuspenseQuery queryKey={["post", id]} queryFn={...}>
  {({ data: post }) => <Post post={post} />}
</SuspenseQuery>
<SuspenseQuery queryKey={["comments", id]} queryFn={...}>
  {({ data: comments }) => <Comments list={comments} />}
</SuspenseQuery>
```

`SuspenseInfiniteQuery`, `SuspenseQueries`도 같은 철학으로 무한 스크롤과
동적 배열 쿼리를 다룬다.
