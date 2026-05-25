---
title: "메모리 누수 해결을 위한 여정 - 이미지 최적화 및 CDN 편"
description: "Next.js 애플리케이션의 메모리 누수를 줄이기 위해 정적 리소스를 CDN으로 옮기고, Image 컴포넌트 캐시를 재구성한 과정."
date: "2025-10-20"
tags: ["nextjs", "performance", "cdn", "memory"]
author: "hovelopin"
series: "메모리 누수 해결을 위한 여정"
seriesOrder: 1
draft: true
cover: "/covers/memory-leak-1-image-cdn.png"
coverAlt: "메모리 누수 1편 — 이미지 최적화 및 CDN 썸네일"
---

운영 중인 Next.js 애플리케이션에서 메모리 사용량이 꾸준히 증가하는 현상이 관측됐습니다. 1편에서는 정적 리소스를 CDN으로 이전하면서 서버측 부하를 덜고, 그 과정에서 Image 컴포넌트의 캐싱 동작을 어떻게 재정비했는지를 정리합니다.

## 1. Image 컴포넌트 최적화 이슈

Next.js의 Image 컴포넌트는 기본적으로 강력한 최적화 기능을 제공합니다. SVG와 AVIF를 제외한 이미지를 WebP 포맷으로 변환하고, 메모리 기반 캐싱으로 응답 속도를 개선합니다.

![Next.js Image 캐시 헤더 1](/imports/memory-leak-1-image-cdn/image-008.png)

![Next.js Image 캐시 헤더 2](/imports/memory-leak-1-image-cdn/image-020.png)

### 기존 Image 컴포넌트 동작 방식

네트워크 환경에서 PNG 이미지를 요청하는 경우의 동작은 다음과 같습니다.

- **첫 번째 요청**: `X-Nextjs-Cache: HIT` 헤더와 함께 캐싱
- **이후 요청**: `max-age` 시간 동안 캐시 유지, 재요청 시 0ms

![캐시 적용 응답 1](/imports/memory-leak-1-image-cdn/image-014.png)

![캐시 적용 응답 2](/imports/memory-leak-1-image-cdn/image-010.png)

문제는 이 메모리 캐시가 시간이 지나며 정리되지 않고 누적된다는 점이었습니다. 임시 조치로 Image 컴포넌트의 캐싱을 끄고 동작을 다시 확인했습니다.

```ts
const config: NextConfig = {
  images: {
    unoptimized: true, // 임시 조치
  },
};
```

![unoptimized 적용 후](/imports/memory-leak-1-image-cdn/image-004.png)

### 캐싱 제거 후 변화

캐싱을 끈 결과 다음과 같은 변화가 있었습니다.

- `X-Nextjs-Cache` 헤더가 사라지고 CloudFront의 `X-Cache` 헤더가 대신 들어옴
- 초기 로딩 속도는 비슷하지만, 304 응답 시 이미지 로딩 시간이 Next.js 캐시 대비 눈에 띄게 증가

![캐싱 제거 후 응답](/imports/memory-leak-1-image-cdn/image-017.png)

즉 캐시를 끈 것 자체로는 해결이 아니라 **다른 곳에서 캐시를 받아줘야** 한다는 결론이었습니다. 그 답이 CDN입니다.

## 2. 정적 리소스를 CDN에서 가져오기

Network 탭을 열어보면 자바스크립트 chunk와 CSS 파일을 모두 Next.js 서버에서 가져온 뒤 내부 메모리에 캐시하는 동작을 확인할 수 있습니다.

**캐시 무효화 후 첫 요청**

![첫 요청 1](/imports/memory-leak-1-image-cdn/image-023.png)

![첫 요청 2](/imports/memory-leak-1-image-cdn/image-011.png)

**새로고침**

![새로고침 1](/imports/memory-leak-1-image-cdn/image-018.png)

![새로고침 2](/imports/memory-leak-1-image-cdn/image-022.png)

이 흐름을 그대로 두면 Next.js 서버가 메모리 캐시를 계속 짊어집니다. 정적 리소스라면 굳이 서버가 들고 있을 필요가 없습니다.

Next.js를 빌드하면 `.next` 폴더가 생성되는데, 이 안에서 대부분의 리소스는 동적으로 만들어집니다. 단, `static` 폴더 아래의 chunks와 CSS, 기타 파일들은 빌드 시 한 번 만들어지고 이후 변경되지 않습니다.

![.next/static 디렉토리 구조](/imports/memory-leak-1-image-cdn/image-012.png)

따라서 `.next/static`을 CDN으로 옮겨 서버 부하를 줄이는 게 자연스럽습니다. 우리 환경에서는 `vf-postatic` 기준으로 `nova/assets/` 폴더가 존재하므로, 같은 depth에 `_next/static`을 배치합니다.

![CDN 디렉토리 배치](/imports/memory-leak-1-image-cdn/image-006.png)

CDN 경로 예시: `nova/_next/static/...`

> ⚠️ `static` 폴더 외의 다른 폴더는 업로드하면 안 되며, `.next` 폴더명은 CDN 업로드 시 `_next`로 바꿔야 합니다.

이제 `next.config`의 `assetPrefix` 옵션을 사용하면 JS/CSS 파일들이 자동으로 CDN 경로로 치환됩니다.

```ts
const nextConfig = {
  assetPrefix: "https://vf-postatic.polarisoffice.com/nova",
};
```

참고: [Next.js — assetPrefix](https://nextjs.org/docs/app/api-reference/config/next-config-js/assetPrefix)

## 3. SCSS 이미지 경로 문제

`assetPrefix` 적용 후 빌드까지는 정상적으로 진행됐지만, **SCSS 파일 내에서 절대 경로로 작성된 이미지의 경우** `assetPrefix` 전체 경로(`https://vf-postatic.polarisoffice.com/nova`)가 아닌 origin(`https://vf-postatic.polarisoffice.com`)만 적용되는 문제가 있었습니다.

`postcss.config`에서 `postcss-url`로 SCSS의 `/assets/` 경로를 `/nova/assets/`로 변환하는 후처리를 넣어 해결했습니다.

```ts
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
    "@csstools/postcss-oklab-function": {
      preserve: false,
    },
    "postcss-url": {
      url: (asset) => {
        const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
        if (env !== "dev") {
          if (asset.url.startsWith("/assets/")) return `/nova${asset.url}`;
        }
        return asset.url;
      },
    },
  },
};
export default config;
```

## 4. 최종 결과

검증 환경에서 적용 후 측정한 결과를 정리합니다.

### Before — Nginx에서 CSS/JS 직접 서빙

![Nginx 서빙 1](/imports/memory-leak-1-image-cdn/image-013.png)

![Nginx 서빙 2](/imports/memory-leak-1-image-cdn/image-025.png)

### After — CDN 경로로 치환

![CDN 적용 1](/imports/memory-leak-1-image-cdn/image-009.png)

![CDN 적용 2](/imports/memory-leak-1-image-cdn/image-015.png)

CSS/JS와 chunk 파일들은 `assetPrefix` 한 줄로 일괄 변경 가능하지만, 이미지 경로의 경우 Next.js 공식 문서에서도 안내하듯이 **각 요소마다 직접 CDN 경로를 지정**해야 합니다.

![이미지 경로 직접 지정](/imports/memory-leak-1-image-cdn/image-019.png)

### 이미지 요청 비교

**Before — 첫 번째 요청**

![Before 첫 요청 1](/imports/memory-leak-1-image-cdn/image-001.png)

![Before 첫 요청 2](/imports/memory-leak-1-image-cdn/image-024.png)

**Before — 두 번째 요청**

![Before 두번째 요청 1](/imports/memory-leak-1-image-cdn/image-021.png)

![Before 두번째 요청 2](/imports/memory-leak-1-image-cdn/image-005.png)

**After — 첫 번째 요청**

![After 첫 요청 1](/imports/memory-leak-1-image-cdn/image-003.png)

![After 첫 요청 2](/imports/memory-leak-1-image-cdn/image-002.png)

**After — 두 번째 요청**

![After 두번째 요청 1](/imports/memory-leak-1-image-cdn/image-007.png)

![After 두번째 요청 2](/imports/memory-leak-1-image-cdn/image-016.png)

이미지를 Next.js 서버가 아닌 CDN을 통해 불러오도록 수정한 결과 서버 부하가 감소했고, 웹페이지 로딩 속도도 전반적으로 향상됐습니다.

다만 메모리 누수의 진짜 원인은 서버측이 아닌 클라이언트 쪽에서 더 다양하게 발생하고 있었는데, 이 부분은 [2편 — 클라이언트 누수 확인 및 렌더링 로직 개선](/posts/memory-leak-2-client-rendering)에서 다룹니다.
