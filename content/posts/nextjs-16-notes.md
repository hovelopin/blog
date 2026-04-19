---
title: "Next.js 16에서 달라진 것들 — 실전 메모"
description: "App Router가 성숙해지면서 바뀐 캐싱 모델, React 19와의 통합, 그리고 실무에서 마주친 함정들."
date: "2026-04-10"
tags: ["nextjs", "react", "frontend"]
author: "hovelopin"
linkPreviews:
  "https://nextjs.org/docs": "/images/link-previews/nextjs-docs.svg"
  "https://react.dev": "/images/link-previews/react-dev.svg"
---

Next.js 16으로 올리면서 마주친 것들을 정리한다. 자세한 변경점은 [Next.js 공식 문서](https://nextjs.org/docs)와 [React 19 문서](https://react.dev)를 참고.

## 1. 캐싱 기본값이 바뀌었다

`fetch()`의 기본 캐싱이 opt-in으로 돌아왔다. 15까지는 `no-store`가 기본이라 의외로 많은 서버 요청이 발생했다. 16에서는 명시적으로 옵트인해야 캐시된다.

```ts
// 기존
const res = await fetch(url);
// 16에서는 기본 캐싱 안 됨

// 캐싱하려면 명시적으로
const res = await fetch(url, { next: { revalidate: 3600 } });
```

이 변화는 좋다. 암묵적 동작은 항상 함정을 만든다.

## 2. `use cache` 지시어

함수/컴포넌트/파일 단위로 캐시 경계를 선언할 수 있게 되었다.

```tsx
"use cache";

export async function getPosts() {
  return db.post.findMany();
}
```

`fetch`에만 묶여 있던 캐싱을 임의의 함수에 붙일 수 있다는 게 크다. 다만 런타임에서만 의미 있는 값을 참조하면 실패하니 주의.

## 3. Partial Prerendering은 여전히 까다롭다

PPR은 정식으로 들어왔지만, 어느 경계를 Suspense로 감싸야 하는지는 여전히 감각에 의존한다. 내 경험칙:

1. 유저별로 달라지는 부분은 모두 `<Suspense>` 안으로
2. 나머지는 자동으로 정적 쉘이 된다
3. 의심스러우면 빌드 로그에서 `λ` / `○` 마크를 확인

## 결론

마이그레이션 자체는 부드러웠다. 이상한 엣지케이스 한두 개 정도. 진짜 어려운 건 언제나 캐싱 모델을 머릿속에 정확히 유지하는 것.
