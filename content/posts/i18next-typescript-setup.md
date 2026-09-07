---
title: "1편. i18next 문자열 key에 타입을 붙이는 과정"
description: "문자열로 작성한 번역 key는 코드만 봐서는 존재 여부를 알기 어렵다. i18n Ally에 의존하던 자동완성을 i18next의 TypeScript 타입 지원으로 옮긴 과정을 정리한다."
date: "2026-09-01"
tags: ["i18next", "typescript", "react", "i18n", "dx"]
author: "hovelopin"
series: "i18next 타입 안전성 탐구"
seriesOrder: 1
---

프론트엔드에서 i18n을 붙이면 가장 먼저 마주치는 코드는 보통 이런 형태다.

```tsx
const title = t("pages.notFound.title");
```

겉보기에는 단순하지만, 프로젝트가 커질수록 이 문자열 하나가 꽤 불안해진다.

`pages.notFound.title`이 실제로 존재하는 key인지, 누군가 리소스 파일에서 이름을 바꾸지는 않았는지, 지금 보고 있는 namespace가 맞는지 코드만 봐서는 바로 알기 어렵다. 오타 하나가 타입 에러가 아니라 런타임의 빈 문장이나 fallback 문자열로 드러나는 경우도 있다.

처음에는 이 문제를 에디터 확장으로 해결했다. VS Code와 Cursor에서 많이 쓰는 `i18n Ally`가 대표적이다. locale 파일 위치를 알려주면 `t('...')` 안에서 번역 key 자동완성을 제공하고, 실제 번역값도 미리 보여주기 때문에 분명히 편하다.

하지만 프로젝트가 여러 개로 분산되기 시작하면 이야기가 달라진다. 어떤 프로젝트는 `locales/ko/common.json`을 쓰고, 어떤 프로젝트는 `public/locales/ko/translation.json`을 쓴다.

namespace를 파일 이름으로 나누는 곳도 있고 하나의 `translation.json`에 몰아넣는 곳도 있다. 구조가 달라질 때마다 i18n Ally 설정도 다시 맞춰야 한다.

자동완성이 되지 않으면 코드가 틀린 것인지, 확장 설정이 틀린 것인지부터 확인해야 했다.

이 글은 그 불편함을 i18next의 TypeScript 지원으로 옮겨 해결한 과정이다. 핵심은 자동완성을 에디터 플러그인의 추론에 맡기는 대신, 프로젝트 코드 안에 번역 리소스 타입을 등록하는 것이다.

![i18next 문자열 key 관리가 TypeScript 타입 정보로 이동하는 과정](/imports/i18next-typescript-setup-flow.svg)

---

## 1. 문자열 key가 불안한 이유

i18next의 기본 API는 문자열 key를 받는다.

```tsx
t("pages.home.title");
```

이 방식은 유연하다. 번역 파일이 JSON이어도 되고, namespace를 여러 개로 나누어도 되며, 런타임에 key를 조합하는 것도 가능하다. 다만 TypeScript 입장에서는 기본적으로 그냥 문자열이다.

```tsx
t("pages.home.title");
t("pages.hmoe.title");
```

`pages.hmoe.title`은 사람이 보면 오타지만, 타입 시스템에는 평범한 문자열일 뿐이다. 두 문자열의 차이를 TypeScript가 자동으로 알아낼 수는 없다.

문제는 이런 오타가 작성 시점에 잘 드러나지 않는다는 데 있다. 번역 리소스와 코드가 따로 관리되기 때문이다.

```json
{
  "pages": {
    "home": {
      "title": "Home"
    }
  }
}
```

코드는 문자열을 가지고 있고, 리소스는 JSON 객체를 가지고 있다. 둘 사이의 관계를 TypeScript가 모르면 `t()` 호출은 타입 검사의 보호를 받지 못한다.

---

## 2. i18n Ally로 먼저 해결했다

이 불편함을 줄이기 위해 처음에는 `i18n Ally`를 썼다. 설정을 맞추면 에디터가 locale 파일을 읽고 `t('...')` 안에서 key 후보를 보여준다.

예를 들어 다음처럼 설정한다.

```json
{
  "i18n-ally.localesPaths": ["public/locales"],
  "i18n-ally.keystyle": "nested",
  "i18n-ally.namespace": true
}
```

그러면 `t('pages.`를 입력할 때 `pages.home.title` 같은 후보가 뜬다. key 옆에 실제 번역값도 보여주기 때문에 글을 쓰는 속도가 빨라진다.

이 방식의 장점은 명확하다.

| 장점                           | 설명                                        |
| ------------------------------ | ------------------------------------------- |
| 설정이 빠르다                  | 타입 선언을 만들지 않아도 자동완성을 얻는다 |
| 번역값을 바로 볼 수 있다       | key만 보고 의미를 추측하지 않아도 된다      |
| JSON 중심 프로젝트와 잘 맞는다 | locale 파일을 그대로 읽는다                 |

하지만 i18n Ally는 어디까지나 에디터 확장이다. 프로젝트의 타입 계약이 아니다.

---

## 3. 프로젝트가 늘어나면 설정이 흔들린다

필자가 불편함을 크게 느낀 지점은 프로젝트가 여러 개로 나뉘었을 때다. 각 프로젝트의 i18n 구조가 조금씩 달랐다.

```plaintext
project-a/
  public/locales/ko/common.json
  public/locales/en/common.json

project-b/
  src/i18n/locales/ko/translation.json
  src/i18n/locales/en/translation.json

project-c/
  packages/web/messages/ko.json
  packages/admin/messages/ko.json
```

구조가 달라지면 확장 설정도 달라진다.

```json
{
  "i18n-ally.localesPaths": ["src/i18n/locales"],
  "i18n-ally.namespace": false
}
```

설정이 틀렸을 때의 증상은 코드 오류와 비슷하다. 자동완성이 안 뜨거나 key 미리보기가 사라지고, namespace가 엉뚱하게 잡히기도 한다. 그때마다 실제 key가 없는 것인지, 확장 설정이 깨진 것인지부터 구분해야 한다.

팀 단위로 보면 문제가 더 커진다. 한 사람의 에디터에서만 잘 동작하는 자동완성은 빌드와 CI가 보장하지 않는다. 확장이 꺼져 있어도 TypeScript는 통과하고, 리뷰에서도 놓칠 수 있다.

결국 필요한 것은 에디터 보조 기능이 아니라 코드베이스가 공유하는 타입 계약이었다.

---

## 4. i18next의 TypeScript 지원으로 옮긴다

i18next는 `CustomTypeOptions`를 통해 프로젝트의 번역 리소스 타입을 등록할 수 있다. 타입 선언 파일에서 `i18next` 모듈을 확장하는 방식이다.

먼저 번역 리소스를 TypeScript가 볼 수 있는 값으로 만든다.

```ts
// src/i18n/resources.ts

export const resources = {
  ko: {
    translation: {
      pages: {
        home: {
          title: "홈",
        },
        notFound: {
          title: "페이지를 찾을 수 없습니다",
          description: "요청한 페이지가 존재하지 않습니다",
        },
      },
    },
  },
} as const;
```

여기서 `as const`가 key 자동완성의 절대 조건은 아니다. TypeScript는 `as const`가 없어도 객체의 프로퍼티 이름 자체는 알고 있다.

```ts
const resources = {
  ko: {
    translation: {
      pages: {
        home: {
          title: "홈",
        },
      },
    },
  },
};
```

이 경우에도 `pages.home.title` 같은 구조는 타입에 남는다. i18next가 문자열 key union을 만들 때 먼저 보는 것도 이 프로퍼티 구조다.

다만 `as const`를 붙이면 문자열 값까지 literal 타입으로 보존된다.

```ts
title: "홈";
```

위 값이 그냥 `string`이 아니라 `'홈'`으로 남는 것이다. key 존재 여부만 볼 때는 큰 차이가 없지만, `{{name}}` 같은 보간 변수 추론이나 리소스 값을 더 좁게 유지하는 데 차이가 생긴다.

그래서 `as const`는 "없으면 key 타입 추론이 불가능하다"라기보다, i18next 타입 지원을 안정적으로 쓰기 위한 권장 설정에 가깝다. 반대로 리소스 타입을 `Record<string, unknown>`처럼 넓게 선언해 버리면 프로퍼티 구조 자체가 사라지므로 key 추론도 깨진다.

그다음 i18next 타입을 확장한다.

```ts
// src/i18n/i18next.d.ts

import { resources } from "./resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: (typeof resources)["ko"];
  }
}
```

여기서 한 가지 헷갈리기 쉬운 지점이 있다. 실제 초기화에 넘기는 `resources`는 언어 코드부터 시작한다.

```plaintext
ko
└── translation
    └── pages
        └── home
            └── title
```

하지만 `CustomTypeOptions.resources`에 필요한 것은 언어 목록이 아니다. `t()`가 사용할 namespace 아래의 key 구조다.

```plaintext
translation
└── pages
    └── home
        └── title
```

그래서 타입 선언에서는 `(typeof resources)["ko"]`처럼 특정 언어 한 층을 벗겨낸 타입을 넘긴다.

`ko`와 `en` 중 무엇을 고르는지가 중요한 것은 아니다. 각 언어가 같은 key 구조를 가진다는 전제 아래, 대표 언어 하나로 namespace 구조를 TypeScript에 알려주는 셈이다.

마지막으로 실제 초기화에서도 같은 리소스를 사용한다.

```ts
// src/i18n/index.ts

import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

i18next.use(initReactI18next).init({
  lng: "ko",
  defaultNS: "translation",
  resources,
});
```

이제 리소스의 실제 값과 타입 선언이 같은 출처를 바라본다.

---

## 5. 무엇이 달라질까

설정 전에는 `t()`의 첫 번째 인자가 넓은 문자열에 가까웠다.

```tsx
t("pages.hmoe.title");
```

설정 후에는 TypeScript가 허용 가능한 key 목록을 계산한다.

```tsx
t("pages.home.title"); // OK
t("pages.hmoe.title"); // TypeScript error
```

IDE 자동완성도 같은 타입 정보에서 나온다.

```tsx
t("pages.");
```

이 위치에서 `home`, `notFound`로 이어지는 후보가 뜬다. 더 정확히는 i18next 타입이 리소스 객체를 분석해 다음과 같은 문자열 key union을 만드는 구조다.

```ts
type Keys =
  | "pages.home.title"
  | "pages.notFound.title"
  | "pages.notFound.description";
```

`t()`는 이 union에 포함된 문자열만 받는다. 그래서 삭제된 key나 오타가 컴파일 단계에서 드러난다.

이 차이는 작지만 크다. i18n Ally가 제공하던 편의 기능 일부가 프로젝트 타입 시스템 안으로 들어오고, 에디터 확장이 꺼져 있어도 CI에서 `tsc`를 돌리면 같은 검사가 동작한다.

---

## 6. JSON 리소스를 그대로 쓰고 있다면

실제 프로젝트에서는 번역 리소스를 `.json`으로 관리하는 경우가 많다.

```plaintext
public/locales/ko/translation.json
public/locales/en/translation.json
```

이 경우에도 방향은 같다. TypeScript가 볼 수 있는 대표 리소스 타입을 만들어 `CustomTypeOptions.resources`에 연결하면 된다.

```ts
import koTranslation from "../../public/locales/ko/translation.json";

export const defaultResources = {
  translation: koTranslation,
};

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: typeof defaultResources;
  }
}
```

다만 JSON import는 환경에 따라 문자열 값이 literal이 아니라 `string`으로 넓어질 수 있다. key 존재 여부 검사는 구조만 있어도 가능하다.

보간 변수까지 정밀하게 잡고 싶다면 리소스를 `as const`가 붙은 TypeScript 파일로 두거나, JSON에서 타입 파일을 생성하는 방식을 고려할 수 있다.

처음부터 완벽할 필요는 없다. 필자에게 가장 큰 효과는 우선 key 존재 여부가 타입으로 잡히는 지점에 있었다.

---

## 7. i18n Ally를 버린다는 뜻은 아니다

여기서 i18n Ally가 필요 없어진다는 뜻은 아니다. 두 도구가 해결하는 층이 다르다.

| 도구                    | 잘하는 일                                          |
| ----------------------- | -------------------------------------------------- |
| i18n Ally               | 번역값 미리보기, 누락 번역 확인, locale 파일 탐색  |
| i18next TypeScript 타입 | key 오타 검출, 삭제된 key 검출, CI에서 동일한 검사 |

i18n Ally는 여전히 번역 파일을 탐색할 때 편하다. 특히 실제 문구를 바로 보여주는 경험은 타입 시스템이 대신하기 어렵다.

하지만 key가 존재하는지 검증하는 일은 타입 시스템 쪽에 두는 편이 안정적이다. 에디터 설정이 조금 달라져도 프로젝트의 타입 검사는 흔들리지 않는다.

---

## 8. 정리하면

문자열 key 방식 자체가 나쁜 것은 아니다. i18next의 기본 API이고, 가장 널리 쓰이는 방식이기도 하다. 다만 번역 리소스와 코드 사이의 관계를 TypeScript가 모르면 문자열 key는 너무 쉽게 틀릴 수 있다.

처음에는 i18n Ally로 이 불편함을 줄일 수 있다. 하지만 프로젝트가 늘어나고 설정이 달라지면 자동완성을 확장 설정에만 맡기기 어렵다.

그래서 `CustomTypeOptions.resources`를 등록한다.

```plaintext
번역 리소스
    ↓
TypeScript 타입 등록
    ↓
t('...') key 자동완성
    ↓
오타와 삭제된 key를 컴파일 단계에서 검출
```

이것이 i18next 타입 안전성의 출발점이다.

다음 글에서는 이 기반 위에서 `enableSelector`를 설정하면 무엇이 달라지는지 살펴본다. 문자열 key를 계속 쓸지, `t($ => $.pages.home.title)` 같은 selector 방식으로 넘어갈지 판단하려면 먼저 런타임 변환 과정을 이해해야 한다.

---

## 함께 보기

이 글은 **i18next 타입 안전성 탐구** 시리즈의 1편이다.

- 2편: [2편. i18next enableSelector는 런타임에서 어떻게 동작할까?](/posts/i18next-selector-runtime)
- 3편: [3편. 문자열 key vs selector: i18next 타입은 어떻게 만들어질까](/posts/i18next-key-vs-selector-types)
