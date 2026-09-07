---
title: "3편. 문자열 key vs selector: i18next 타입은 어떻게 만들어질까"
description: "t('pages.notFound.title')과 t($ => $.pages.notFound.title)은 같은 리소스를 조회한다. 두 방식의 타입이 어떻게 만들어지는지, enableSelector가 타입 레벨에서 무엇을 바꾸는지 비교한다."
date: "2026-09-07"
tags: ["i18next", "typescript", "react", "i18n", "dx"]
author: "hovelopin"
cover: "/covers/i18next-key-vs-selector-types-turtle.png"
coverAlt: "거북이 지도 제작자가 문자열 key 경로와 selector 타입 경로를 비교하는 일러스트"
series: "i18next 타입 안전성 탐구"
seriesOrder: 3
---

1편에서는 문자열 key에 i18next 타입을 붙이는 설정 과정을 봤고, 2편에서는 `enableSelector`가 런타임에서 selector 함수를 문자열 key로 바꾸는 과정을 따라갔다. 이제 남은 질문은 TypeScript 쪽이다.

react-i18next에서 `t`를 사용할 때 번역 key를 전달하는 방식은 크게 두 가지다.

```javascript
t("pages.notFound.title"); // 문자열 key
t(($) => $.pages.notFound.title); // selector
```

두 코드는 겉보기에는 꽤 다르다. 하나는 문자열을 직접 입력하고, 다른 하나는 객체를 탐색하는 코드처럼 작성한다. 하지만 런타임에서 selector 역시 결국 문자열 key로 변환된다.

```
'pages.notFound.title'
```

즉, **최종적으로 같은 번역 리소스를 조회한다는 점은 동일하다.** 차이는 TypeScript가 `t`를 어떻게 해석하느냐에 있다.

문자열 방식에서는 TypeScript가 **"허용된 문자열 목록"**을 만들고, selector 방식에서는 **"$가 번역 리소스 객체처럼 보이도록 타입을 만든다."**

이 글은 그 차이를 타입 관점에서 정리한다. 같은 `resources`를 기준으로 문자열 key 방식과 selector 방식의 타입이 각각 어떻게 만들어지는지 보고, 이어서 `enableSelector`가 타입 레벨에서 실제로 무엇을 바꾸는지 따져본다.

미리 짚어둘 점이 있다. 두 방식은 **동시에 쓸 수 있는 선택지가 아니라 배타적인 설정**이다.

`enableSelector`를 설정하면 `t('...')`이 컴파일 에러가 되고, 설정하지 않으면 `t($ => ...)`이 에러가 된다. 자세한 이유는 뒤쪽에서 역할과 선택 기준을 나누어 다룬다.

---

## 1. 공통 설정

먼저 번역 리소스 타입을 다음과 같이 정의했다고 가정하자.

```typescript
// i18next.d.ts

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";

    resources: {
      translation: {
        pages: {
          notFound: {
            title: "Page not found";
            description: "The page you requested does not exist.";
          };

          home: {
            title: "Home";
          };
        };
      };
    };
  }
}
```

그리고 컴포넌트에서는 다음과 같이 사용한다.

```
const { t } = useTranslation('translation');
```

여기서부터 문자열 방식과 selector 방식의 타입 경로가 갈라진다.

---

## 2. `t('pages.notFound.title')` — 문자열 key 방식

### `t`의 첫 번째 인자는 어떤 타입일까?

기본적인 문자열 key 방식에서는 `t`의 첫 번째 인자가 문자열이다.

```
t('pages.notFound.title');
```

물론 아무 문자열이나 전달할 수 있는 것은 아니다. `resources`가 타입으로 등록되어 있다면 i18next는 리소스 구조를 분석해 **사용 가능한 key들의 문자열 union**을 만든다.

예를 들어 위 리소스에서는 개념적으로 다음과 같은 타입이 만들어진다.

```typescript
type AllowedKeys =
  | "pages.notFound.title"
  | "pages.notFound.description"
  | "pages.home.title";
```

> 기본 설정에서는 값이 문자열인 **리프 key만** union에 들어간다. `'pages'`, `'pages.notFound'` 같은 중간 경로는 `returnObjects: true`일 때만 추가된다.

관련 타입은 i18next v26.4.0의 [`t.d.ts` 타입 정의](https://github.com/i18next/i18next/blob/v26.4.0/typescript/t.d.ts#L84-L95)에서 확인할 수 있다.

이 구간에 `KeysBuilderWithoutReturnObjects`와 `KeysBuilderWithReturnObjects`가 함께 있다. 여기서 리프 key는 트리의 맨 끝에 있는 key를 뜻한다. 위 예시에서 `pages`와 `pages.notFound`는 값이 객체인 중간 경로이고, `pages.notFound.title`은 값이 문자열인 마지막 경로다.

그래서 기본 설정에서는 `t('pages.notFound.title')`은 허용되지만 `t('pages.notFound')`는 허용되지 않는다.

따라서 다음 코드는 정상이다.

```
t('pages.notFound.title'); // ✅
t('pages.home.title');     // ✅
```

반면 존재하지 않는 key를 입력하면 TypeScript가 에러를 표시한다.

```
t('pages.notFound.fake'); // ❌
```

---

### 문자열 key는 어떻게 타입으로 만들어질까?

타입의 흐름을 단순화하면 다음과 같다.

```
CustomTypeOptions.resources
        ↓
번역 리소스 구조 분석
        ↓
KeysBuilder
        ↓
'a.b.c' 형태의 문자열 key 생성
        ↓
ParseKeys
        ↓
TFunction의 첫 번째 인자 타입
        ↓
IDE 문자열 자동완성
```

예를 들어 이 구조가 있다면,

```
{
  pages: {
    notFound: {
      title: 'Page not found';
    };
  };
}
```

타입 레벨에서는 중첩된 구조를 다음과 같은 문자열 경로로 펼친다.

```
pages.notFound.title
```

값이 객체인 `pages`와 `pages.notFound`는 더 깊은 경로를 만드는 데만 쓰이고, 그 자체는 key로 남지 않는다. 그렇게 만들어진 문자열들이 `t`의 첫 번째 인자에 허용된다.

---

### IDE 자동완성은 어디서 오는가?

문자열 방식의 자동완성 출처는 다음 타입 흐름이다.

```
CustomTypeOptions.resources
        ↓
KeysBuilder
        ↓
ParseKeys
        ↓
문자열 literal union
        ↓
IDE 자동완성
```

따라서 다음처럼 입력하면,

```
t('pages
```

IDE는 문자열 후보를 제안한다.

```
'pages.notFound.title'
'pages.notFound.description'
'pages.home.title'
```

즉, 문자열 방식의 자동완성은 본질적으로 다음과 같다.

> **"이 위치에 들어갈 수 있는 문자열들의 목록"을 TypeScript가 알고 있기 때문에 제공되는 자동완성**

점(`.`) 역시 문자열의 일부이기 때문에 직접 입력하면서 경로를 완성한다.

---

## 3. `t($ => $.pages.notFound.title)` — selector 방식

selector를 사용하려면 `enableSelector` 옵션이 설정되어 있어야 한다.

```javascript
t(($) => $.pages.notFound.title);
```

문자열 방식과 가장 큰 차이는 첫 번째 인자의 타입이다.

문자열 방식에서는 첫 번째 인자가 이런 형태였다면,

```
'pages.notFound.title'
```

반면 selector 방식에서는 함수가 첫 번째 인자가 된다.

```
src => ...
```

이 함수의 `src`, 즉 우리가 `$`라고 이름 붙인 파라미터가 번역 리소스 구조를 그대로 따라가는 타입을 갖는다.

---

### `$`는 어떤 타입일까?

selector 방식에서 i18next는 `resources`를 기반으로 `$`의 원본 타입을 계산한다. 개념적으로는 다음과 같다.

```typescript
type Source = {
  pages: {
    notFound: {
      title: "Page not found";
      description: "The page you requested does not exist.";
    };

    home: {
      title: "Home";
    };
  };
};
```

따라서 다음 코드에서,

```javascript
t(($) => $.pages.notFound.title);
```

TypeScript는 `$`를 대략 이런 객체처럼 인식한다.

```
$ = {
  pages: {
    notFound: {
      title: ...
      description: ...
    }

    home: {
      title: ...
    }
  }
}
```

> 단, 리소스 구조가 _그대로_ 오는 것은 아니다. 뒤에 나오는 `FilterKeys`가 복수형·context 접미사를 접는다.
>
> 그래서 `itemCount_one` / `itemCount_other` 같은 key는 `$`에서 `itemCount` 하나로 보인다. 이 예시에는 그런 key가 없어서 결과가 같다.

그래서 `$` 뒤에 점을 입력하면 일반적인 객체 프로퍼티 자동완성이 동작한다. 탐색 흐름은 다음처럼 단계별로 좁혀진다.

```plaintext
$
└── pages
    ├── notFound
    │   ├── title
    │   └── description
    └── home
        └── title
```

즉, selector 방식의 자동완성은 문자열 목록 자동완성이 아니다.

> **실제 객체를 탐색하는 것처럼 TypeScript의 프로퍼티 자동완성이 동작한다.**

---

### selector의 타입은 어떻게 만들어질까?

타입 흐름을 단순화하면 다음과 같다.

```
CustomTypeOptions.resources
        ↓
NsResource / GetSource
        ↓
번역 리소스를 selector용 객체 타입으로 계산
        ↓
Select / FilterKeys
        ↓
plural, context 등의 key 형태 정리
        ↓
TFunctionSelector
        ↓
(src: ...) => ...
        ↓
IDE 프로퍼티 자동완성
```

핵심 타입들의 역할을 간단히 보면 다음과 같다.

| 타입                | 역할                                                |
| ------------------- | --------------------------------------------------- |
| `GetSource`         | selector에서 사용할 원본 리소스 타입 계산           |
| `Select`            | selector에서 접근할 수 있는 타입 구성               |
| `FilterKeys`        | plural/context 관련 key를 selector 형태에 맞게 정리 |
| `TFunctionSelector` | `t($ => ...)` 형태의 함수 시그니처 정의             |

결국 TypeScript는 `$`를 단순한 `any`나 Proxy 타입으로 보는 것이 아니다.

`resources`에서 계산한 타입 트리를 `$`에 넣어준다.

---

### IDE 자동완성은 어디서 오는가?

selector 방식의 자동완성 경로는 다음과 같다.

```
CustomTypeOptions.resources
        ↓
GetSource
        ↓
$의 원본 객체 타입 생성
        ↓
Select / FilterKeys
        ↓
TFunctionSelector의 콜백 파라미터 타입
        ↓
IDE 프로퍼티 자동완성
```

그래서 다음 코드에서,

```
t($ => $.)
```

IDE는 문자열을 제안하는 것이 아니라 `$` 객체의 프로퍼티를 제안한다.

```plaintext
$
└── pages
    ├── notFound
    │   ├── title
    │   └── description
    └── home
        └── title
```

문자열 방식과 달리 경로 전체를 하나의 문자열로 완성하는 것이 아니라, **객체 트리를 따라 내려가면서 자동완성**한다.

---

## 4. 두 방식의 차이

두 코드를 다시 보면 다음과 같다.

```javascript
const { t } = useTranslation("translation");

// enableSelector 없음 (기본값) 일 때
t("pages.notFound.title");

// enableSelector: true 일 때
t(($) => $.pages.notFound.title);

// 두 줄은 서로 다른 설정에서의 코드다. 한 프로젝트에서 동시에 쓸 수는 없다.
```

최종적으로는 같은 번역 key를 가리킨다.

```
pages.notFound.title
```

하지만 TypeScript가 자동완성을 만드는 방식은 다르다.

| 항목          | 문자열 방식          | selector 방식          |
| ------------- | -------------------- | ---------------------- |
| 첫 번째 인자  | 문자열               | 함수                   |
| 핵심 타입     | `ParseKeys`          | `GetSource`, `Select`  |
| 타입 표현     | 문자열 literal union | 객체 타입 트리         |
| 자동완성 형태 | 문자열 후보 목록     | 객체 프로퍼티          |
| 점(`.`)       | 문자열 경로의 일부   | 프로퍼티 접근 연산자   |
| 오타 검출     | union에 없는 문자열  | 존재하지 않는 프로퍼티 |
| 입력 경험     | key를 문자열로 입력  | 객체를 탐색하듯 입력   |

가장 큰 차이는 자동완성의 UX다.

### 문자열 방식

```
t('pages.notFound.title');
```

IDE는 다음과 같은 값을 제안한다.

```
'pages.notFound.title'
'pages.notFound.description'
'pages.home.title'
```

즉, **완성 가능한 문자열 목록**을 보여주는 방식이다.

---

### selector 방식

```javascript
t(($) => $.pages.notFound.title);
```

IDE는 단계별로 프로퍼티를 제안한다.

```
$
└── pages
     ├── notFound
     │    ├── title
     │    └── description
     │
     └── home
          └── title
```

즉, **객체 구조를 탐색하는 경험**에 가깝다.

---

## 5. `react-i18next`와 `i18next`는 각각 어디까지 관여할까?

여기서 역할을 나누어 보면 조금 더 명확하다.

```
useTranslation('translation')
        │
        ▼
react-i18next
        │
        │ namespace, keyPrefix 추론
        │
        ▼
TFunction<'translation', undefined>
        │
        ▼
i18next 타입 정의
        │
        ├── enableSelector OFF
        │       ↓
        │   ParseKeys
        │       ↓
        │   문자열 key 타입
        │
        └── enableSelector ON
                ↓
            GetSource
                ↓
            selector 객체 타입
                ↓
            TFunctionSelector
        │
        ▼
IDE Language Service
        │
        ├── 문자열 literal 자동완성
        │
        └── 프로퍼티 체인 자동완성
```

`react-i18next`의 역할은 상대적으로 단순하다. `useTranslation()`에서 사용한 namespace와 `keyPrefix`를 바탕으로 적절한 `TFunction<Ns, KPrefix>`를 제공한다.

반면 실제로 다음과 같은 차이를 만드는 타입 로직은 i18next 쪽에 있다.

```
enableSelector OFF
→ ParseKeys 기반 문자열 key

enableSelector ON
→ GetSource 기반 selector 함수
```

즉, 자동완성의 **내용**, 다시 말해

> 어떤 번역 key가 존재하는지
> `$`에서 어떤 프로퍼티에 접근할 수 있는지

를 결정하는 출발점은 모두 이것이다.

```
CustomTypeOptions.resources
```

---

## 6. 여기까지 정리하면

두 방식은 결국 같은 번역 리소스를 조회한다.

```javascript
t("pages.notFound.title");

t(($) => $.pages.notFound.title);
```

런타임에서 최종적으로 가리키는 key 역시 같다.

```
pages.notFound.title
```

하지만 TypeScript가 그 key를 표현하는 방식은 다르다. 문자열 방식은 리소스 구조를 펼쳐서,

```
'pages.notFound.title'
```

같은 **문자열 literal union**을 만든다.

반면 selector 방식은 리소스 구조 자체를 `$`의 타입으로 만들어,

```
$.pages.notFound.title
```

처럼 **객체 프로퍼티를 탐색하는 경험**을 제공한다.

정리하면 다음과 같다.

```javascript
문자열 방식

resources
    ↓
문자열 key union
    ↓
t('pages.notFound.title')


selector 방식

resources
    ↓
객체 타입 트리
    ↓
t($ => $.pages.notFound.title)
```

여기까지 보면 `enableSelector`가 자동완성을 새로 만들어 주는 것은 아니다. 이미 `resources`에 존재하는 타입 정보를 **문자열 union으로 보여줄 것인지**, 아니면 **객체 프로퍼티 트리로 보여줄 것인지**를 바꾸는 기능에 가깝다.

이 차이가 두 방식의 가장 큰 개발 경험 차이를 만든다.

> **문자열 key 방식은 "올바른 문자열을 선택하는 방식"이고, selector 방식은 "번역 리소스 객체를 탐색하는 방식"이다.**

그렇다면 selector는 단지 취향의 문제일까. 여기서부터는 실제 선택 기준을 봐야 한다. 자동완성 모양이 달라지는 것 말고도 정확성, 타입 계산 비용, 에디터 기능에서 차이가 생긴다.

---

## 7. 그래서 selector 방식의 장점은 무엇인가?

`resources`만 타입으로 등록하면 문자열 방식에서도 자동완성과 오타 검출이 된다. 따라서 질문은 "selector가 더 타입 안전한가"가 아니라 "selector가 추가로 무엇을 해결하는가"에 가깝다. 이 지점을 확인하기 위해 같은 리소스를 두 설정으로 각각 컴파일해 비교했다.

### 먼저, 차이가 없는 것들

| 케이스                                      | 문자열  | selector |
| ------------------------------------------- | ------- | -------- |
| 존재하지 않는 키(오타)                      | ❌ 에러 | ❌ 에러  |
| 보간 키에 변수 누락 (옵션 객체를 넘긴 경우) | ❌ 에러 | ❌ 에러  |
| 보간 키에 변수 누락 (옵션 자체를 생략)      | ✅ 통과 | ✅ 통과  |
| IDE 자동완성                                | 동작    | 동작     |

오타 검출도, 보간 검사도 동등하다. 자동완성 역시 형태가 다를 뿐 양쪽 다 동작한다. 즉 **"selector를 써야 타입 안전해진다"는 말은 정확하지 않다.** 타입 안전성의 대부분은 `enableSelector`가 아니라 `CustomTypeOptions.resources` 등록에서 온다.

### selector에만 있는 것

#### 1. 복수형 키에 `count`를 강제한다

| 케이스                                  | 문자열  | selector |
| --------------------------------------- | ------- | -------- |
| 복수형 키에 `count` 누락 (옵션 생략)    | ✅ 통과 | ❌ 에러  |
| 복수형 키에 `count` 누락 (빈 옵션 `{}`) | ✅ 통과 | ❌ 에러  |

```typescript
// resources: { cart: { itemCount_one: '...', itemCount_other: '...' } }

t("cart.itemCount"); // 문자열: 통과 → 런타임에 복수형이 조용히 깨진다
t(($) => $.cart.itemCount); // selector: 컴파일 에러
t(($) => $.cart.itemCount, { count: 3 }); // OK
```

두 방식의 유일한 **정확성** 차이다. 동작 원리는 앞서 본 `FilterKeys`에 있다.

`FilterKeys`는 `_one`/`_other` 접미사를 `itemCount` 하나로 접으면서 그 값에 `PluralValue` 브랜드를 씌운다.

그리고 `TFunctionSelector`의 오버로드가 그 브랜드를 읽어 옵션 인자를 *선택*에서 *필수*로 바꾼다.

```typescript
// i18next/typescript/t.d.ts
...args: ReturnType<Fn> extends PluralValue<string>
  ? [options: Opts & { count: number } & ...]   // 필수
  : [options?: Opts & ...]                      // 선택
```

문자열 방식에는 이 장치가 없다. 키가 `'cart.itemCount'`라는 평범한 문자열이라, 복수형 키인지 타입 레벨에서 구분할 근거가 없기 때문이다.

#### 2. 대규모 리소스에서 타입 계산이 싸다

문자열 방식은 호출 지점마다 전체 키의 문자열 union을 실체화해야 한다. selector는 프로퍼티를 한 단계씩만 풀고, `'optimize'`는 `FilterKeys`까지 건너뛴다.

리프 키 7,776개(깊이 5) 리소스에 `t()` 호출 50개를 두고 `tsc --noEmit`을 측정한 결과다.

| 설정                           | 소요 시간 | 배수 |
| ------------------------------ | --------- | ---- |
| 문자열 (`enableSelector` 없음) | 1067 ms   | 1.0× |
| `enableSelector: true`         | 564 ms    | 1.9× |
| `enableSelector: 'optimize'`   | 302 ms    | 3.5× |

`Select` 타입을 보면 `'optimize'`가 하는 일이 딱 한 줄이라는 것을 알 수 있다.

```typescript
type Select<T, Context> = $IsResourcesDefined extends false
  ? $Turtles // 리소스 타입이 없으면 무한 중첩 → 뭐든 통과
  : [_EnableSelector] extends ["optimize"]
  ? T // ← FilterKeys 를 통째로 건너뛴다
  : FilterKeys<T, Context>;
```

대신 `'optimize'`에서는 `_one`/`_other`가 정리되지 않은 날것의 리소스 모양이 `$`에 그대로 노출되고, ①의 `count` 강제도 사라진다. 속도와 정확성을 맞바꾸는 옵션인 셈이다.

번역 키가 수백 개 수준이면 이 항목은 체감되지 않는다. 실제로 리프 650개 규모에서는 문자열 방식도 0.3초대에 끝난다. 수천 개 이상으로 커지거나 IDE가 눈에 띄게 느려질 때 의미가 생긴다.

#### 3. go-to-definition

`$.pages.notFound.title`은 진짜 프로퍼티 접근이므로, 에디터에서 `title`에 커서를 두고 정의로 이동하면 번역 JSON의 해당 키로 점프한다. `t('pages.notFound.title')`은 그냥 문자열이라 아무 일도 일어나지 않는다.

i18next가 이 옵션을 설명하면서 첫 번째로 드는 이유도 여기에 있다.

> Enables features like go-to definition, and better DX/faster autocompletion for TypeScript developers. — `i18next/typescript/options.d.ts`

### 반대로 문자열 방식이 나은 점

**중간 매칭 검색이 된다.** `t('` 안에서 `notFound`만 입력해도 `pages.notFound.title`이 후보에 뜬다. selector는 `$.pages`부터 위에서 아래로 내려가야 하므로, 최상위 키 이름을 모르면 도달할 수 없다.

- 리소스 구조를 **탐색**할 때는 selector
- 키를 **검색**할 때는 문자열

이 항목은 트레이드오프지 일방적인 개선이 아니다.

### 공식 로드맵: 문자열 방식은 사라지는가?

i18next 공식 문서의 TypeScript 페이지는 다음과 같이 적고 있다.

> As of v25.4, this option is off by default, but will be set to `true` by default in v26, with tentative plans to deprecate type-level support for the "string-based" (non-selector) API in v27. — [i18next 공식 문서 · TypeScript](https://www.i18next.com/overview/typescript)

다만 이 문장을 그대로 받아들이기 전에 확인이 필요하다. **v26.4.0 시점에도** `enableSelector`**의 기본값은 여전히** `false`**다** (`typescript/options.d.ts`).

문서가 예고한 "v26에서 기본값 `true`"는 아직 반영되지 않았고, 저장소의 CHANGELOG나 타입 정의 어디에도 문자열 API에 대한 `@deprecated` 표기는 없다.

따라서 현재로서는 이렇게 정리하는 편이 정확하다.

- 문자열 방식이 **지금 당장 없어지는 것은 아니다.** 공식 문서의 표현도 "tentative plans"이다.
- 다만 프로젝트가 selector를 **권장 방향으로 잡고 있는 것은 분명하다.**
- 새 기능(`'strict'`, `SelectorParam`, selector `keyPrefix` 등)은 selector 쪽에만 추가되고 있고, 마이그레이션용 codemod와 vite 플러그인도 함께 배포되었다.
- 제거된다 해도 **타입 레벨 지원**이 대상이다. 런타임은 계속 문자열 키를 받는다.

### 선택 기준 정리

`enableSelector`를 켤지 판단할 때 실제로 저울에 올려야 하는 것은 이 정도다.

| 얻는 것                                  | 치르는 것                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| 복수형 `count` 강제 (유일한 정확성 개선) | `t('...')` 호출을 **전부** 바꿔야 함 — 시그니처가 교체되므로 혼용 불가 |
| go-to-definition                         | 키 검색 시 중간 매칭 불가                                              |
| 대규모 리소스에서의 타입 계산 속도       | 수백 키 규모에서는 체감 이점 없음                                      |
| 공식 권장 방향에 정렬                    |                                                                        |

아직 `CustomTypeOptions` 자체가 없는 프로젝트라면 순서는 명확하다. `resources` **등록이 먼저다.** 코드 변경 없이 오타·삭제된 키 검출을 얻을 수 있고, 그것이 두 방식의 공통 기반이기 때문이다.

selector 전환은 그 다음 문제다. 복수형 `count` 강제, go-to-definition, 대규모 리소스에서의 타입 계산 속도가 필요하다면 전환할 이유가 있다.

반대로 키 검색 경험이 중요하고 리소스 규모가 크지 않다면 문자열 방식도 여전히 충분히 현실적인 선택이다.

---

## 함께 보기

이 글은 **i18next 타입 안전성 탐구** 시리즈의 3편이다.

- 1편: [1편. i18next 문자열 key에 타입을 붙이는 과정](/posts/i18next-typescript-setup)
- 2편: [2편. i18next enableSelector는 런타임에서 어떻게 동작할까?](/posts/i18next-selector-runtime)
