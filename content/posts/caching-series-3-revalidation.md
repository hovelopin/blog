---
title: "App Router 캐싱 모델 — 3편: revalidation 전략"
description: "태그 기반과 경로 기반 무효화를 어떻게 섞어 쓰는지, 그리고 실수로 stale을 만들지 않는 패턴."
date: "2026-04-30"
tags: ["nextjs", "caching", "react"]
author: "hovelopin"
series: "App Router 캐싱 모델 깊게 보기"
seriesOrder: 3
---

[1편](/posts/caching-series-1-fetch)에서 `fetch`, [2편](/posts/caching-series-2-use-cache)에서 `"use cache"`를 봤다. 이번 편은 캐시를 **어떻게 깨느냐**다.

## 두 가지 무효화 축

App Router의 무효화는 크게 두 축이다.

- **태그 기반** — `revalidateTag("posts")`
- **경로 기반** — `revalidatePath("/blog")`

태그는 데이터의 정체성에 붙이고, 경로는 페이지 단위로 깬다. 보통은 태그가 우선이다. 같은 데이터를 여러 페이지가 읽고 있을 때 태그 한 줄로 모두 무효화된다.

## 태그를 거는 위치

`fetch`에는 옵션으로:

```ts
const res = await fetch(url, {
  next: { tags: ["posts"] },
});
```

`"use cache"` 함수에는 `cacheTag()`로:

```tsx
"use cache";
import { unstable_cacheTag as cacheTag } from "next/cache";

export async function getPosts() {
  cacheTag("posts");
  return db.post.findMany();
}
```

쓰기 동작이 일어나는 Server Action에서 같은 태그를 깨주면 자동으로 새로 가져온다.

```tsx
"use server";
import { revalidateTag } from "next/cache";

export async function createPost(input: NewPost) {
  await db.post.create({ data: input });
  revalidateTag("posts");
}
```

## 자주 하는 실수

1. **태그를 너무 굵게 잡는다** — `"all"` 같은 만능 태그로 모두 깨면 캐시가 사실상 없는 것과 같다.
2. **태그를 너무 잘게 쪼갠다** — `posts:${id}` 같이 잘게 쪼갠 뒤 정작 목록 화면 태그를 안 깨서 새 글이 안 보인다.
3. **read-after-write를 잊는다** — 무효화는 캐시를 표시만 하지, 즉시 새 값을 가져오지 않는다. Server Action 직후의 redirect에서 마주칠 수 있다.

## 정리

3편에 걸쳐 캐싱 모델을 한 바퀴 돌았다. 핵심은 두 줄로 요약된다:

- 캐싱은 명시적으로, 인자는 직렬화 가능하게
- 태그는 데이터의 정체성, 경로는 페이지 단위. 둘을 섞어 쓰되 굵기를 맞춰라

이 시리즈는 여기서 마친다. 후속 글에서는 PPR(Partial Prerendering)과 캐싱이 만나는 지점을 다룰 예정.
