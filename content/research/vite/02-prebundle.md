---
title: "esbuild 사전 번들링"
---

## 의존성은 미리, 소스는 온디맨드

node_modules의 CommonJS 의존성은 esbuild로 한 번 ESM으로 변환해 캐시합니다.
Go로 짜인 esbuild 덕에 이 과정이 매우 빠릅니다.
