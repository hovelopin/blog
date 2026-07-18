---
title: "내부 뜯어보기 ①: 모든 컴포넌트가 공유하는 Object.assign 패턴"
---

`Suspense`, `ClientOnly`, `Delay`, `ErrorBoundary`, `ErrorBoundaryGroup`, `lazy` —
Suspensive의 거의 모든 컴포넌트는 `Object.assign`으로 만들어진다. 이 패턴이 어떤 일을 하는지부터 살펴보자.

## Object.assign

```tsx
Object.assign(target, ...sources);
```

`sources`의 (열거 가능한 own) 속성들을 `target`에 복사한 뒤, `target`을
반환한다.

```tsx
Object.assign({ a: 1 }, { b: 2 }); // → { a: 1, b: 2 }
```

핵심은 두 가지다.

- `target`을 직접 변경(mutate)하고 그 `target`을 그대로 반환한다.
- 자바스크립트에서 함수도 객체이므로, 함수를 `target`으로 넘겨 프로퍼티를
  붙일 수 있다.

## 이 프로젝트에서의 형태

```tsx
export const Suspense = Object.assign(
  (props) => <.../>,      // ① 함수(= 컴포넌트)
  { displayName, with },  // ② 거기에 붙일 속성들
);
```

- ①의 함수 덕분에 `<Suspense/>`처럼 **컴포넌트로 렌더**할 수 있고,
- ②의 속성 덕분에 `Suspense.with(...)`, `Suspense.displayName`처럼
  **프로퍼티로 접근**할 수 있다.

결과물 `Suspense`는 "호출도 되고(컴포넌트) 프로퍼티도 가진(메서드·메타)"
하이브리드 객체가 됩니다.

## Object.assign 패턴을 쓴 이유는 무엇일까?

```tsx
const Suspense = (props) => <.../>;
Suspense.with = (...) => ...;       // ❌ TS 에러: 'with'는 이 함수 타입에 없음
Suspense.displayName = "Suspense";  // ❌ 같은 문제
```

TypeScript에서는 함수 타입에 없는 속성을 할당하면 타입 에러가
난다. 반면 `Object.assign`을 쓰면 이렇게 된다.

```tsx
const Suspense = Object.assign((props) => <.../>, { with, displayName });
//    ^? typeof (props) => JSX  &  { with, displayName }   ← intersection으로 추론
```

`Object.assign`의 타입 시그니처는 `(target: T, source: U) => T & U`다.
그래서 반환 타입이 **함수 타입 ∩ 속성 타입의 교차(intersection)**로 추론된다.
덕분에 함수 부분은 `<Suspense/>`로 호출할 수 있고, 속성 부분은
`Suspense.with`로 Type Safe하게 접근할 수 있다.

## 컴포넌트에만 쓰이는 게 아니다

`packages/react/src`를 훑어보면 이 패턴이 컴포넌트에만 국한되지 않는다.

| 대상 | 붙인 것 | 의미 |
| --- | --- | --- |
| `Suspense` · `ClientOnly` · `Delay` · `ErrorBoundary` · `ErrorBoundaryGroup` | `displayName`, `with` | 컴포넌트 + HOC 헬퍼 + DevTools 이름 |
| `lazy` | `load` | 컴포넌트 + **프리로드 메서드** |
| `ErrorBoundaryContext` | `displayName` | **Context 객체** + DevTools 이름 |

주목할 점이 있다.

- `lazy`는 `displayName`/`with` 대신 `.load` 메서드를 붙였다. 같은 패턴을
  메타가 아니라 기능을 얹는 데 쓴 것이다.
- `ErrorBoundaryContext`는 컴포넌트가 아니라 `createContext()`가 만든 Context
  객체에 붙였다. 이 패턴이 "함수든 객체든 무엇에나 정적 속성을 붙이는" 일반
  관용구임을 보여준다.


## 한 줄 정리

> `Object.assign`은 "컴포넌트(함수)나 Context에, 그에 딸린 정적 API·메타데이터를,
> 타입 안전한 하나의 값으로 묶는" 이 프로젝트의 표준 관용구다. 네임스페이스화와
> 타입 intersection이 그 핵심 동기다.
