---
title: "메모리 누수 해결을 위한 여정 - 이미지 최적화 및 CDN 편"
description: "Next.js 애플리케이션의 성능을 개선하기 위해 정적 리소스를 CDN으로 이전하는 과정과 그 결과."
date: "2026-05-06"
tags: ["nextjs", "performance", "cdn", "memory"]
author: "hovelopin"
series: "메모리 누수 해결을 위한 여정"
seriesOrder: 1
---

Next.js 애플리케이션의 성능을 개선하기 위해 정적 리소스를 CDN으로 이전하는 과정과 그 결과를 공유합니다.

## 1. Image 컴포넌트 최적화 이슈

Next.js의 Image 컴포넌트는 기본적으로 강력한 최적화 기능을 제공합니다. SVG와 AVIF를 제외한 이미지를 WebP 포맷으로 변환하고, 메모리 기반 캐싱을 통해 성능을 향상시킵니다.

![image-20250918-012023.png](/imports/memory-leak-1-image-cdn/image-008.png)![image-20250918-012105.png](/imports/memory-leak-1-image-cdn/image-020.png)

### 기존 Image 컴포넌트 동작 방식

네트워크 환경에서 PNG 이미지를 요청하는 경우:

- **첫 번째 요청**: `X-Nextjs-Cache: HIT` 헤더와 함께 캐싱 진행

- **이후 요청**: max-age 시간 동안 캐시 유지, 재요청 시 0ms 소요

![image-20250918-012359.png](/imports/memory-leak-1-image-cdn/image-014.png)![image-20250918-012343.png](/imports/memory-leak-1-image-cdn/image-010.png)

[메모리 누수 이슈](https://polarisoffice.atlassian.net/wiki/spaces/~harvey.h.kim/pages/227512168/NextJS+Memory+Leak#4.-%EC%9D%B4%EC%99%B8%EC%97%90-%EC%97%AC%EB%9F%AC-%EB%AC%B8%EC%A0%9C-%EC%82%AC%ED%95%AD)가 있어 Image 컴포넌트 캐싱을 제거하고 다시 확인해봤더니 아래와 같은 결과가 나왔습니다.

```
const config: NextConfig = {
  images: {
    unoptimized: true, // 임시 조치
  },
};
```

![image-20250918-013725.png](/imports/memory-leak-1-image-cdn/image-004.png)

### 캐싱 제거 후 변화

메모리 누수 이슈로 인해 Image 컴포넌트의 캐싱을 제거한 결과

- `X-Nextjs-Cache` 헤더 제거

- CloudFront의 `X-Cache` 헤더로 대체

- 초기 로딩 속도는 유사하나, 304 응답 시에도 이미지 로딩 시간이 Next.js 캐시 대비 현저히 증가

![image-20250918-013852.png](/imports/memory-leak-1-image-cdn/image-017.png)

## 2. 정적 리소스 CDN에서 가져오기

network 요청을 열어보면 브라우저를 통해서 리소스를 가져오는것을 볼 수 있는데 자바스크립트 chunk 파일과 css 파일들을 전부 next 서버로부터 가져오고 이후에 next 내부 메모리에 캐시를 하는것을 알 수 있습니다.

 

**캐시 무효화 후 첫 요청**

![image-20250919-070626.png](/imports/memory-leak-1-image-cdn/image-023.png)![image-20250919-070546.png](/imports/memory-leak-1-image-cdn/image-011.png)

**새로고침**

![image-20250919-070803.png](/imports/memory-leak-1-image-cdn/image-018.png)![image-20250919-070837.png](/imports/memory-leak-1-image-cdn/image-022.png)

현재 위와 같이 next 서버 내부에 메모리 캐시를 진행하는데 해당 부분을 CDN으로 옮겨서 부하를 줄일 수 있습니다.

 

nextjs 프로젝트를 빌드하면 아래와 같은 .next 폴더를 생성하게 되는데 .next 폴더안에 대부분의 리소스들은 동적으로 생성되기 때문에 필요할때마다 가져와야 하지만 static 폴더에 있는 chunks , css 폴더와 기타 파일들은 빌드시에 생성하여 리소스들이 변경되지 않습니다.

![image-20250919-071020.png](/imports/memory-leak-1-image-cdn/image-012.png)

따라서 .next 폴더에 static 폴더를 현재 존재하는 CDN 경로로 변경해여 next 서버 부하를 줄이는 작업이 필요합니다. 아래 vf-postatic 기준으로 nova 폴더 밑에 assets 폴더가 존재하기 때문에 assets 경로와 동일한 depth에 \_next/static 파일을 적용합니다.

![image-20250919-071240.png](/imports/memory-leak-1-image-cdn/image-006.png)

ex ) `nova/_next/static/~~`

 

> ❗ 주의할점은 static 폴더 이외에 폴더는 업로드하면 안되고 `.next` 폴더의 파일명을 `_next`로 설정하여야 합니다.

 

위와 같이 적용 후 next.config 파일에서 `assetPrefix` 를 활용하여 js,css 파일들을 자동적으로 CDN 주소로 변경하여 서버 부하를 줄일 수 있습니다.

 

```
const nextConfig = {
  assetPrefix: 'https://vf-postatic.polarisoffice.com/nova',
};
```

 

[https://nextjs.org/docs/app/api-reference/config/next-config-js/assetPrefix](https://nextjs.org/docs/app/api-reference/config/next-config-js/assetPrefix)

## 3. SCSS 이미지 경로 문제

빌드 시 `.next` 폴더 내의 `static` 경로에 생성되는 CSS, JS 및 기타 청크(chunk) 파일들은 `assetPrefix` 설정을 통해 모두 CDN 경로로 변경할 수 있습니다. 해당 설정을 적용한 뒤 빌드까지는 정상적으로 진행되었으나, SCSS 파일 내에서 절대 경로로 생성된 이미지 경로의 경우 `assetPrefix`에 지정한 전체 경로(`https://vf-postatic.polarisoffice.com/nova`)가 아닌, `origin` 값(`https://vf-postatic.polarisoffice.com`)만 적용되는 문제가 발생했습니다.

 

위와 같은 문제점을 해결하기 위해 아래와 같이 postcss config를 통해 scss 파일에서 `/assets` 경로로 들어오는 요소를 전부 `/nova/assets`로 변환하는 작업을 추가하였습니다.

```
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    '@csstools/postcss-oklab-function': {
      preserve: false
    },
    'postcss-url': {
      url: (asset) => {
        const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
        if (env !== 'dev') {
          if (asset.url.startsWith('/assets/')) return `/nova${asset.url}`;
        }
        return asset.url;
      }
    }
  }
};
export default config;
```

## 4. 최종 결과

위와 같이 변경 후 검증에서 테스트해본 결과 아래와 같은 결과를 볼 수 있었습니다.

 

`as-is`

![image-20251015-015400.png](/imports/memory-leak-1-image-cdn/image-013.png)![image-20251015-015427.png](/imports/memory-leak-1-image-cdn/image-025.png)

기존에는 Nginx를 통해 CSS와 JS 파일들을 모두 제공했으나, 해당 부분을 아래와 같이 CDN 경로로 변경하였습니다.

`to-be`

![image-20251016-010123.png](/imports/memory-leak-1-image-cdn/image-009.png)![image-20251016-010205.png](/imports/memory-leak-1-image-cdn/image-015.png)

CSS, JS 및 기타 청크(chunk) 파일들은 해당 설정을 통해 일괄적으로 경로 변경이 가능하지만, 이미지 경로의 경우 Next.js 공식 문서에서도 안내하듯이 각 요소마다 직접 CDN 경로를 지정해주어야 합니다.

![image-20251016-011204.png](/imports/memory-leak-1-image-cdn/image-019.png)

`as-is`

첫번째 요청시

![image-20251015-015726.png](/imports/memory-leak-1-image-cdn/image-001.png)![image-20251015-015737.png](/imports/memory-leak-1-image-cdn/image-024.png)

두번째 요청시

![image-20251015-015619.png](/imports/memory-leak-1-image-cdn/image-021.png)![image-20251015-015629.png](/imports/memory-leak-1-image-cdn/image-005.png)

`to-be`

첫번째 요청시

![image-20251016-045831.png](/imports/memory-leak-1-image-cdn/image-003.png)![image-20251016-045850.png](/imports/memory-leak-1-image-cdn/image-002.png)

두번째 요청시

![image-20251016-050111.png](/imports/memory-leak-1-image-cdn/image-007.png)![image-20251016-045917.png](/imports/memory-leak-1-image-cdn/image-016.png)

이미지를 Next.js 서버가 아닌 CDN을 통해 불러오도록 수정하면서 서버 부하가 감소하고 웹페이지 로딩 속도 역시 전반적으로 향상된 것을 확인할 수 있었습니다.
