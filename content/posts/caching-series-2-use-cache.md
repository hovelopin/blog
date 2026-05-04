---
title: "App Router 캐싱 모델 — 2편: use cache 지시어"
description: "fetch 바깥의 함수에도 캐시 경계를 그을 수 있게 된 use cache 지시어를 실전에서 어떻게 쓰는지."
date: "2026-04-26"
tags: ["nextjs", "caching", "react"]
author: "hovelopin"
series: "App Router 캐싱 모델 깊게 보기"
seriesOrder: 2
---

[1편](/posts/caching-series-1-fetch)에서는 `fetch`의 캐싱이 명시적 옵트인이 됐다는 걸 봤다. 이번엔 `fetch`가 아닌 일반 함수를 캐시하는 도구, `"use cache"` 지시어를 본다.

## 어디에 붙이나

함수, 컴포넌트, 파일 단위로 붙일 수 있다.

```tsx
"use cache";

export async function getPostBySlug(slug: string) {
  return db.post.findUnique({ where: { slug } });
}
```

이 함수의 반환값은 인자(`slug`)를 키로 캐시된다. 두 번째 호출부터는 DB까지 안 간다.

## 무엇이 캐시 키가 되는가

함수의 인자가 직렬화 가능해야 한다. 직렬화할 수 없는 객체(예: 클래스 인스턴스, 함수)를 인자로 받으면 캐시되지 않거나 빌드 타임 에러가 난다.

```tsx
"use cache";

// OK — slug는 string
async function getPost(slug: string) { ... }

// ⚠️ 위험 — req 전체를 키로 만들 수 없음
async function getPost(req: Request) { ... }
```

요청 전체 같은 큰 객체는 받지 말고, 정확히 필요한 값(쿠키, 헤더 한 줄)만 인자로 추려내라.

## 런타임 값과 섞이면 안 된다

`"use cache"` 함수 안에서 `cookies()`나 `headers()`를 부르면 망가진다. 그것들은 요청별로 다른 값을 반환하니, 캐시 함수 안에서 호출하는 순간 의미가 무너진다.

대신 호출자가 필요한 값을 꺼내서 인자로 넘기는 패턴을 쓴다.

```tsx
// 호출하는 쪽
const userId = await getUserIdFromCookies();
const posts = await getPostsForUser(userId);

// 캐시 함수
"use cache";
async function getPostsForUser(userId: string) { ... }
```

## 다음 편

다음 편에서는 캐시된 값을 어떻게 무효화(revalidate)하느냐를 본다. 태그 기반 무효화, 경로 기반 무효화, 그리고 둘을 어떻게 조합하는지.
