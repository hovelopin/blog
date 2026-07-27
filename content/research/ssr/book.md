---
title: "SSR의 모든 것"
description: "MPA·SPA·CSR·SSR의 갈래에서 출발해 React의 서버 렌더 API, Hydration, Streaming, Fizz 엔진, Server Component까지 한 줄기로 읽는 탐구 노트."
date: "2026-07-27"
color: "#0b7285"
tags: ["react", "ssr", "streaming", "rsc"]
---

서버 사이드 렌더링은 "서버에서 HTML을 만들어 보낸다"는 한 문장으로 요약되지만
그 한 문장 안에는 렌더 API 선택, Hydration, 스트리밍, Server Component까지
서로 맞물린 층이 여러 겹 쌓여 있다.

이 책은 그 층을 아래에서부터 하나씩 걷어내며 정리한 탐구 노트다. 렌더링 방식의
갈래를 먼저 잡고 React가 제공하는 API를 짚은 뒤, 그 API를 굴리는
엔진과 그 위에 얹힌 최신 개념으로 올라간다.

- **1장 — MPA, SPA, CSR, SSR**: 렌더링 방식의 네 갈래와 각각이 해결한 문제
- **2장 — Streaming SSR**: 동기 SSR의 워터폴을 Suspense로 끊어내는 방법
- **3장 — SSR을 위한 리액트 API**: `react-dom/server`·`react-dom/static`의 렌더 API 총정리
- **4장 — Hydrate**: 서버가 보낸 정적 마크업을 `hydrateRoot`로 살려내는 과정
- **5장 — Fizz Engine**: 스트리밍 SSR을 실제로 굴리는 서버 렌더러의 내부
- **6장 — Next.js 없이 SSR 하기**: 프레임워크가 대신 해주던 일을 직접 짚어보기

앞부분(1~2장)은 "왜 이런 방식이 나왔는가"를 개념 위주로 다루고 3장부터는 실제
API와 그 아래 구현을 코드 단위로 파고든다.
