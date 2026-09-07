---
title: "2편. i18next enableSelector는 런타임에서 어떻게 동작할까?"
description: "i18next의 enableSelector 옵션을 설정하면 번역 키를 함수로 쓸 수 있다. 문자열이 아닌 함수를 넘겼는데도 번역이 되는 이유를 Proxy·revoke·Symbol 중심으로 확인한다."
date: "2026-09-03"
tags: ["i18next", "react", "typescript", "proxy", "i18n"]
author: "hovelopin"
series: "i18next 타입 안전성 탐구"
seriesOrder: 2
---

```tsx
const { t } = useTranslation();

<h1>{t(($) => $.pages.notFound.title)}</h1>;
```

1편에서는 문자열 key에 i18next 타입을 연결해 오타와 삭제된 key를 컴파일 단계에서 잡는 방법을 정리했다. 그 다음으로 마주치는 선택지가 `enableSelector`다. 이 옵션을 설정하면 번역 key를 문자열로 직접 작성하지 않고 함수 형태로 표현할 수 있다.

**문자열 key 방식**

```tsx
t("pages.notFound.title");
```

문자열 안에 경로를 직접 적는 방식이다.

**selector 방식**

```tsx
t(($) => $.pages.notFound.title);
```

번역 리소스를 객체처럼 탐색하는 형태가 된다.

문자열 대신 함수를 넘겼는데도 번역은 정상적으로 동작하고, IDE에서는 `pages → notFound → title`까지 프로퍼티를 따라가며 자동완성도 제공된다. 그렇다면 내부에서는 어떻게 동작할까?

**결론부터 말하면**, i18next는 selector 함수에 Proxy 객체를 넣어 실행하면서 함수 안에서 접근한 프로퍼티 경로를 기록한다. 그 경로를 다시 일반적인 문자열 키로 변환한 뒤 기존 번역 엔진에 전달하는 구조다.

즉, `$ => $.pages.notFound.title`는 결국 런타임에서 다음 문자열로 변환된다.

```tsx
"pages.notFound.title";
```

그 이후의 번역 과정은 기존 i18next와 동일하다. 이 글에서는 타입 선언이 아니라 런타임 동작을 따라간다. `useTranslation()`에서 받은 `t`가 어떻게 만들어지고, selector 함수가 어떤 과정을 거쳐 문자열 키가 되는지 내부 구현 흐름으로 확인해보자.

---

## 1. 전체 흐름 먼저 보기

예제 하나를 끝까지 따라가 보자.

```tsx
t(($) => $.pages.notFound.title);
```

전체 흐름은 다음과 같다.

![selector 호출의 전체 흐름](/imports/i18next-selector-runtime/selector-overall-flow.png)

핵심은 중간에 selector를 문자열 키로 변환하는 단계가 하나 추가되었다는 점이다. 이 변환이 어디서 시작되는지 보려면 먼저 `t`가 어떤 함수인지부터 봐야 한다.

---

## 2. 화살표 함수는 바로 실행되지 않는다

다음 코드를 보면 `$`가 어디서 오는지 궁금해진다.

```tsx
t(($) => $.pages.notFound.title);
```

중요한 점은 이 시점에서 화살표 함수가 아직 실행되지 않는다는 데 있다. `t()`가 받는 값은 다음과 같다.

```tsx
($) => $.pages.notFound.title;
```

위 값은 아직 실행되지 않은 함수일 뿐이다. 나중에 i18next가 이 함수를 실행하면서 `$` 자리에 자신이 만든 Proxy 객체를 넣는다.

```tsx
selector(createProxy());
```

즉, 개념적으로는 이런 형태다.

```tsx
const selector = ($) => $.pages.notFound.title;

const proxy = createProxy();

selector(proxy);
```

이때부터 `$`가 실제 값을 갖는다. 이제 이 함수를 호출하는 `t`가 어디서 만들어지는지 살펴보자.

---

## 3. useTranslation()이 반환하는 t

먼저 한 가지 짚고 넘어갈 부분이 있다.

```tsx
const { t } = useTranslation();
```

여기서 받은 `t`는 단순히 전역 `i18next.t`를 그대로 반환한 것이 아니다. `useTranslation()`은 현재 컴포넌트의 상태에 맞는 **전용 `t` 함수**를 만들어 돌려준다.

### useTranslation()에서 하는 일

`react-i18next/src/useTranslation.js`에서는 대략 다음 과정을 거친다.

```tsx
export const useTranslation = (
  ns,
  props = {},
) => {
  // ① i18n 인스턴스 확보
  const { i18n: i18nFromProps } = props;
  const { i18n: i18nFromContext, defaultNS: defaultNSFromContext } = useContext(I18nContext) || {};

  const i18n = i18nFromProps || i18nFromContext || getI18n();

  // ② React 관련 옵션 병합
   const i18nOptions = useMemo(
      () => ({ ...getDefaults(), ...i18n?.options?.react, ...props }),
      [i18n, props],
    );


  // ③ namespace 결정
  const nsOrContext = ns || defaultNSFromContext || i18n?.options?.defaultNS;

  const unstableNamespaces =
    isString(nsOrContext)
      ? [nsOrContext]
      : nsOrContext || ['translation'];

  const namespaces = useMemo(
    () => unstableNamespaces,
    unstableNamespaces,
  );

  // ...

  // ④ 현재 상태에 맞는 t 생성
  const calculatedT =
    i18n.getFixedT(...);

  // ...
};
```

여기서 중요한 지점이 `getFixedT()`다.

---

## 4. getFixedT()는 왜 필요한가?

예를 들어 다음 두 컴포넌트가 있다고 해보자.

```tsx
const { t } = useTranslation("common");

t("hello");
```

→ `common`에서 찾아야 함

```tsx
const { t } = useTranslation("auth");

t("hello");
```

→ `auth`에서 찾아야 함

하지만 전역 `i18next.t`만 사용하면 매번 namespace를 직접 전달해야 한다.

```tsx
i18next.t("hello", {
  ns: "common",
  lng: "ko",
});
```

반면 `useTranslation('common')`에서 받은 `t`는 이미 다음 정보를 기억하고 있어야 한다.

```plaintext
namespace = common
language  = ko
keyPrefix = ...
```

이 정보를 매 호출마다 넘기는 대신 미리 묶어 둔 함수가 필요하고, 그 역할을 `getFixedT()`가 맡는다.

```tsx
const calculatedT = i18n.getFixedT(
  currentLng,
  i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0],
  keyPrefix,
  { scopeNs: namespaces }
);
```

`getFixedT()`는 쉽게 말해 **특정 namespace와 language를 기억하는 전용 `t` 함수**를 만들어 주는 함수다.

```tsx
const { t } = useTranslation("common");

t("hello");
```

위 로직을 실행하면 내부적으로는 `common` namespace를 기본값으로 사용하는 `t`가 동작하며, selector 함수도 바로 이 전용 `t` 안으로 들어온다.

### ns와 scopeNs를 나눈 이유

여기서 조금 흥미로운 부분이 있다.

```tsx
i18n.getFixedT(
  currentLng,
  namespaces[0], // ns
  keyPrefix,
  { scopeNs: namespaces }
);
```

`ns`와 `scopeNs`가 서로 다른 역할을 한다.

| 값        | 예시              | 역할                                    |
| --------- | ----------------- | --------------------------------------- |
| `ns`      | `'translation'`   | 실제 번역을 찾을 때 사용                |
| `scopeNs` | `['translation']` | selector에서 namespace를 판별할 때 사용 |

예를 들어 다음과 같이 여러 namespace를 사용할 수 있다.

```tsx
useTranslation(["a", "b"]);
```

이 경우 개념적으로는 다음과 같이 동작한다.

![ns와 scopeNs가 나뉘어 전달되는 구조](/imports/i18next-selector-runtime/ns-scopens-split.png)

왜 둘을 나눴을까. 일반적인 번역 호출에서는 기본 namespace만 사용하는 편이 효율적이기 때문이다.

```tsx
t("foo");
```

하지만 selector에서는 다음과 같은 표현도 가능해야 한다.

```tsx
t(($) => $.b.foo);
```

이때 `b`가 일반적인 번역 키인지, namespace인지 판단하려면 전체 namespace 목록이 필요하다. 그래서 실제 조회에 사용할 `ns`와 selector 판정에 사용할 `scopeNs`를 나누어 전달한다.

---

## 5. fixedT가 selector 함수를 받는다

이제 `getFixedT()`가 만든 전용 `t` 안으로 들어가 보자. 함수는 대략 이런 형태다.

```tsx
const fixedT = (key, opts, ...rest) => {
  // ...

  o.lng = o.lng || fixedT.lng;

  const explicitCallNs = o.ns !== undefined && o.ns !== null;

  o.ns = o.ns || fixedT.ns;

  // ...

  const selectorOpts = {
    ...this.options,
    ...o,
  };

  if (Array.isArray(scopeNs) && !explicitCallNs) {
    selectorOpts.ns = scopeNs;
  }

  // selector 함수라면 문자열 키로 변환
  if (typeof key === "function") {
    key = keysFromSelector(key, selectorOpts);
  }

  return this.t(resultKey, o);
};
```

여기서 가장 중요한 부분은 이것이다.

```tsx
if (typeof key === "function") {
  key = keysFromSelector(key, selectorOpts);
}
```

우리가 전달한 값은 문자열이 아니라 함수다.

```tsx
t(($) => $.pages.notFound.title);
```

따라서 이 시점에서 다음 함수가 호출된다.

```tsx
keysFromSelector(($) => $.pages.notFound.title);
```

이 함수 안에서 selector가 실행되고 문자열 키로 변환된다. 다음 단계의 핵심은 Proxy다.

---

## 6. Proxy가 접근 경로를 기록한다

`selector.js`의 핵심은 Proxy다. selector가 실제 리소스 객체를 받는 것은 아니지만, Proxy를 받으면 프로퍼티 접근을 모두 기록할 수 있다. 구조를 단순화하면 다음과 같다.

```tsx
const PATH_KEY = Symbol("i18next/PATH_KEY");

function createProxy() {
  const state = [];
  const handler = Object.create(null);

  let proxy;

  handler.get = (target, key) => {
    proxy?.revoke?.();

    if (key === PATH_KEY) {
      return state;
    }

    state.push(key);

    proxy = Proxy.revocable(target, handler);

    return proxy.proxy;
  };

  return Proxy.revocable(Object.create(null), handler).proxy;
}
```

그리고 이 Proxy를 selector에 넣어 실행한다.

```tsx
const { [PATH_KEY]: path } = selector(createProxy());
```

여기서 `$`가 처음 런타임 값을 갖는다. 개념적으로는 다음과 같다.

```tsx
const $ = createProxy();

selector($);
```

즉, `$ => $.pages.notFound.title`가 실제로 실행된다. 다만 `$`는 번역 리소스가 아니라 접근을 기록하는 Proxy다.

### $.pages.notFound.title에서 무슨 일이 일어날까?

Proxy는 모든 프로퍼티 접근을 가로챌 수 있으므로, `$.pages.notFound.title`을 평가하는 동안 `get` 트랩은 세 번 호출된다. 그림으로 보면 이렇다.

![프로퍼티 접근마다 경로가 기록되는 과정](/imports/i18next-selector-runtime/proxy-path-recording.png)

#### 첫 번째 접근

```tsx
$.pages;
```

```plaintext
key = 'pages'
```

state는 다음과 같다.

```tsx
["pages"];
```

그리고 새로운 Proxy를 반환한다.

```plaintext
P1
```

#### 두 번째 접근

```tsx
P1.notFound;
```

```plaintext
key = 'notFound'
```

state는 다음과 같다.

```tsx
["pages", "notFound"];
```

그리고 새로운 Proxy를 반환한다.

```plaintext
P2
```

#### 세 번째 접근

```tsx
P2.title;
```

```plaintext
key = 'title'
```

state는 다음과 같다.

```tsx
["pages", "notFound", "title"];
```

그리고 새로운 Proxy를 반환한다.

```plaintext
P3
```

전체 흐름을 표로 보면 다음과 같다.

| 순서 | 접근한 키  | state                            | 반환 |
| ---- | ---------- | -------------------------------- | ---- |
| 1    | `pages`    | `['pages']`                      | P1   |
| 2    | `notFound` | `['pages', 'notFound']`          | P2   |
| 3    | `title`    | `['pages', 'notFound', 'title']` | P3   |

중요한 점은 selector의 반환값이 문자열이 아니라는 것이다.

```tsx
($) => $.pages.notFound.title;
```

이 함수가 실제로 반환하는 것은 최종 Proxy다. 하지만 i18next는 반환값 자체가 아니라, Proxy를 거치며 기록된 경로를 사용한다.

```plaintext
['pages', 'notFound', 'title']
```

이제 이 배열만 꺼내면 된다.

---

## 7. 왜 revoke()가 필요할까?

Proxy를 만드는 코드에는 조금 특이한 부분이 있다.

```tsx
proxy?.revoke?.();
```

즉, 새로운 프로퍼티에 접근할 때 이전 Proxy를 폐기한다. 이유는 경로를 기록하는 배열 `state`를 체인 전체가 공유하기 때문이다. 예를 들어 Proxy를 재사용할 수 있다고 가정해 보자.

```tsx
($) => {
  const a = $.aidraft;

  a.service;

  return a.title;
};
```

원래 의도는 다음일 수 있다.

```plaintext
aidraft.title
```

하지만 `a.service`를 한 번 읽으면서 state에 다음 값이 들어간다.

```plaintext
['aidraft', 'service']
```

그 상태에서 다시 `a.title`을 호출하면 다음처럼 경로가 오염될 수 있다.

```plaintext
aidraft.service.title
```

그림으로 보면 이렇다.

![Proxy 재사용으로 경로가 오염되는 상황과 revoke](/imports/i18next-selector-runtime/proxy-revoke.png)

이 문제는 조용히 발생하기 때문에 오히려 위험하다. i18next가 이전 Proxy를 즉시 폐기하는 이유도 여기에 있다.

```tsx
proxy?.revoke?.();
```

이제 중간 Proxy를 다시 사용하면 잘못된 경로를 만들지 않고 즉시 에러가 발생한다.

```plaintext
TypeError:
Cannot perform 'get' on a proxy
that has been revoked
```

즉, `revoke()`의 목적은 중간 Proxy를 한 번만 사용할 수 있도록 만들어 경로가 조용히 오염되는 것을 막는 데 있다.

---

## 8. 기록한 경로는 어떻게 꺼낼까?

여기까지 경로는 배열에 저장되어 있다.

```tsx
["pages", "notFound", "title"];
```

하지만 Proxy는 모든 프로퍼티 접근을 가로챈다.

예를 들어 다음처럼 일반적인 문자열 프로퍼티를 사용하면,

```tsx
result.path;
```

Proxy는 이것도 경로 접근으로 인식해서 `'path'`를 state에 추가한다. 따라서 단순히 다음처럼 값을 꺼낼 수 없다.

```tsx
result.path;
```

경로를 기록하는 접근과 내부 상태를 꺼내는 접근은 구분되어야 한다. 그래서 Symbol을 사용한다.

```tsx
const PATH_KEY = Symbol("i18next/PATH_KEY");
```

그리고 다음과 같이 접근한다.

```tsx
const { [PATH_KEY]: path } = result;
```

Proxy 입장에서는 일반적인 번역 키가 아니라 특별한 Symbol이 들어왔다는 것을 알 수 있다.

```tsx
if (key === PATH_KEY) {
  return state;
}
```

따라서 이 접근은 state에 기록되지 않고 바로 배열을 반환한다.

```tsx
["pages", "notFound", "title"];
```

두 종류의 접근을 그림으로 보면 이렇다.

![일반 키 접근과 PATH_KEY 접근이 분기되는 구조](/imports/i18next-selector-runtime/proxy-get-branch.png)

### 왜 문자열이 아니라 Symbol일까?

문자열 키는 사용자 데이터와 충돌할 가능성이 있다. 예를 들어 라이브러리가 내부적으로 `__internal` 같은 필드를 사용한다고 해보자. 사용자가 우연히 동일한 키를 번역 리소스에 넣으면 충돌할 수 있다.

```json
{
  "__internal": "user value"
}
```

반면 Symbol은 이름이 같아도 서로 다른 값이다.

```tsx
// false
Symbol("key") === Symbol("key");
```

따라서 다음과 같은 특성이 생긴다.

```plaintext
문자열
→ 이름이 같으면 같은 키

Symbol
→ 설명이 같아도 서로 다른 키
```

번역 리소스의 키는 일반적으로 문자열이기 때문에 내부 제어용 Symbol과 충돌할 가능성이 없다. 즉, `PATH_KEY`는 Proxy에게 "이건 번역 키 접근이 아니니 지금까지 기록한 경로를 반환하라"는 특별한 신호가 된다.

---

## 9. 배열을 문자열 키로 변환한다

경로를 얻었다면 이제 다음 배열을 문자열로 바꾸면 된다.

```tsx
["pages", "notFound", "title"];
```

기본적인 경우 결과는 간단하다.

```tsx
path.join(".");
```

```plaintext
pages.notFound.title
```

다만 i18next에는 namespace라는 개념이 있어서 한 가지 과정이 더 필요하다. 예를 들어 다음 selector가 있다고 해보자.

```tsx
($) => $.b.foo;
```

여기서 `b`는 두 가지 의미를 가질 수 있다.

**일반적인 번역 키**

```plaintext
b.foo
```

**namespace**

```plaintext
b:foo
```

이 둘을 구분해야 한다.

### namespace 판정

관련 코드는 대략 다음과 같다.

```tsx
const keySeparator = opts?.keySeparator ?? ".";

const nsSeparator = opts?.nsSeparator ?? ":";

const strict = opts?.enableSelector === "strict";

if (path.length > 1 && nsSeparator) {
  const ns = opts?.ns;

  const nsList = strict
    ? Array.isArray(ns)
      ? ns
      : ns
      ? [ns]
      : null
    : Array.isArray(ns)
    ? ns
    : null;

  if (nsList) {
    const candidates = strict
      ? nsList
      : nsList.length > 1
      ? nsList.slice(1)
      : [];

    if (candidates.includes(path[0])) {
      return `${path[0]}${nsSeparator}${path.slice(1).join(keySeparator)}`;
    }
  }
}

return path.join(keySeparator);
```

예를 들어 다음과 같은 경우다.

| 상황                         | namespace 후보 | `$.b.foo` 결과 |
| ---------------------------- | -------------- | -------------- |
| `useTranslation()`           | `[]`           | `b.foo`        |
| `useTranslation(['a', 'b'])` | `['b']`        | `b:foo`        |
| `enableSelector: 'strict'`   | `['a', 'b']`   | `b:foo`        |

이 과정을 거치면 selector 함수는 최종적으로 일반적인 i18next 키가 된다.

```tsx
$ => $.pages.notFound.title
          ↓
pages.notFound.title
```

---

## 10. 여기부터는 기존 i18next와 동일하다

여기까지 오면 selector와 관련된 특별한 동작은 거의 끝난다. 최종적으로는 다음 호출과 동일해진다.

```tsx
t("pages.notFound.title");
```

번역 엔진은 문자열 키를 받아 namespace와 언어를 기준으로 리소스를 탐색한다. 개념적으로는 다음과 같은 흐름이다.

```plaintext
   pages.notFound.title
           │
           ▼
      namespace 분리
           │
           ▼
      언어 후보 탐색      ko → en
           │
           ▼
     namespace 탐색
           │
           ▼
        key 탐색
           │
           ▼
   리소스에서 최종 값 조회
```

최종적으로는 다음과 같은 경로를 찾게 된다.

```tsx
data["ko"]["translation"]["pages"]["notFound"]["title"];
```

그리고 결과를 반환한다.

```plaintext
페이지를 찾을 수 없습니다
```

---

## 11. 전체 과정을 다시 정리하면

처음 코드로 돌아가 보자.

```tsx
t(($) => $.pages.notFound.title);
```

실제로는 다음 순서로 동작한다.

| 단계 | 위치               | 역할                               |
| ---- | ------------------ | ---------------------------------- |
| 1    | `useTranslation`   | i18n 상태와 namespace를 준비       |
| 2    | `getFixedT`        | 현재 컴포넌트에 맞는 전용 `t` 생성 |
| 3    | `fixedT`           | selector 함수인지 확인             |
| 4    | `keysFromSelector` | Proxy를 selector에 전달            |
| 5    | `Proxy`            | 프로퍼티 접근 경로 기록            |
| 6    | `Symbol`           | 기록된 경로 회수                   |
| 7    | selector 변환      | 배열을 문자열 키로 변환            |
| 8    | `Translator`       | 기존 i18next 방식으로 번역 조회    |

이 흐름에서 중요한 점은 `$ => $.pages.notFound.title`를 지원하기 위해 번역 엔진 자체가 크게 바뀐 것은 아니라는 데 있다. 기존 번역 엔진 앞에 다음과 같은 변환 단계가 하나 추가되었다.

```plaintext
   selector 함수
        ↓
  Proxy로 경로 기록      ← 새로 추가된 레이어
        ↓
    문자열 키 생성
        ↓
  기존 i18next 번역 엔진   ← 기존 그대로
```

---

## 12. Proxy, revoke, Symbol의 역할

이 기능을 지탱하는 장치는 세 가지다.

**Proxy**

프로퍼티 접근을 가로채서 경로를 기록한다.

```plaintext
$.pages.notFound
      ↓
['pages','notFound']
```

**revoke**

중간 Proxy의 재사용을 막아 경로 오염을 방지한다.

```plaintext
재사용 시도
   ↓
즉시 에러
```

**Symbol**

사용자 번역 키와 충돌하지 않는 방식으로 기록된 경로를 회수한다.

```plaintext
PATH_KEY
   ↓
state 반환
```

---

## 13. 마무리

처음에는 다음 코드가 낯설게 보인다.

```tsx
t(($) => $.pages.notFound.title);
```

문자열이 아니라 함수를 넘겼는데 번역이 되고, `$`에서는 자동완성까지 제공된다. 하지만 런타임만 놓고 보면 구조는 단순하다.

```plaintext
      함수를 전달한다
             ↓
i18next가 Proxy를 넣어 실행한다
             ↓
   프로퍼티 접근을 기록한다
             ↓
  경로를 문자열 키로 바꾼다
             ↓
기존 i18next 번역 엔진에 전달한다
```

결국 selector API는 기존 번역 방식을 완전히 새로 만든 기능이라기보다, **문자열로 작성하던 번역 키를 Proxy와 TypeScript를 이용해 코드 형태로 표현하게 만든 레이어**에 가깝다.

그 레이어를 안전하게 만들기 위해 `Proxy`, `revoke`, `Symbol`이 각각 역할을 나눈다.

```plaintext
Proxy
→ 경로를 기록하고

revoke
→ 경로 오염을 막고

Symbol
→ 안전하게 경로를 회수한다
```

이 과정을 알고 나면 `t($ => $.pages.notFound.title)`은 낯선 호출이 아니다. 내부에서는 결국 우리가 익숙하게 사용하던 문자열 키로 돌아가기 때문이다.

---

## 함께 보기

이 글은 **i18next 타입 안전성 탐구** 시리즈의 2편이다.

- 1편: [1편. i18next 문자열 key에 타입을 붙이는 과정](/posts/i18next-typescript-setup)
- 3편: [3편. 문자열 key vs selector: i18next 타입은 어떻게 만들어질까](/posts/i18next-key-vs-selector-types)
