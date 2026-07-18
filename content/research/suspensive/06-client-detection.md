---
title: "내부 뜯어보기 ②: useIsClient와 ClientOnly로 서버/클라 판별하기"
---

Suspensive 라이브러리에서 "서버냐 클라이언트냐"를 가리는 일은 `useIsClient`
hook으로 정의되어 있다. `ClientOnly`는 그 훅을 JSX로 감싼 얇은 래퍼이고, `Suspense`의
`clientOnly` 옵션도 이 둘을 거친다.

## useIsClient

```tsx
"use client";
import { useSyncExternalStore } from "react";
import { noop } from "./utils/noop";

const emptySubscribe = () => noop;
const getSnapshot = () => true; // 클라이언트에서 읽는 값
const getServerSnapshot = () => false; // 서버에서 읽는 값
export const useIsClient = () =>
  useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
```

> "지금 브라우저(클라이언트)에서 렌더되고 있나?"를 알려주는 훅. 서버 렌더 중엔
> `false`, 브라우저에선 `true`를 반환한다.

## useSyncExternalStore의 세 번째 인자

이 훅의 전부는 React 18의 `useSyncExternalStore` 호출이다. 이름 그대로 "외부
저장소를 React 렌더와 동기화"하는 훅이고, 인자는 셋이다.

```tsx
useSyncExternalStore(
  subscribe, // ① 저장소 변화를 구독하는 함수
  getSnapshot, // ② 클라이언트에서 현재 값을 읽는 함수
  getServerSnapshot, // ③ 서버(SSR)에서 값을 읽는 함수
);
```

세 번째 인자 `getServerSnapshot`이 핵심이다.

- 서버에서 HTML을 만들 때 → React가 `getServerSnapshot` 호출 → `false`
- 브라우저에서 렌더할 때 → React가 `getSnapshot` 호출 → `true`

똑같은 훅인데 누가(서버·브라우저) 부르느냐에 따라 다른 함수가 실행되니,
`if (typeof window)` 같은 조건문 하나 없이 "서버면 false, 클라면 true"가
나온다.

## subscribe가 아무것도 안 하는 이유

`useSyncExternalStore`의 첫 인자 `subscribe`는 원래 "값이 바뀌면 React에게
알려주는 통로"이고, 정리를 위해 구독 해제 함수를 반환해야 한다.

그런데 "클라이언트인가?"라는 값은 한 번 정해지면 절대 바뀌지 않는다. 마운트된
순간부터 쭉 `true`다. 바뀔 일이 없으니 알려줄 것도 없다. 그래서
이렇게 쓴다.

```tsx
const emptySubscribe = () => noop; // noop = () => void 0, 아무것도 안 하는 함수
```

구독 로직은 없고, 반환값은 `noop`이라 "해제할 것도
없다"는 빈 함수다.
값이 변하지 않는 상수 저장소를 `useSyncExternalStore`로 표현하는 표준
관용구다.

`getSnapshot`이 원시값 `true`(항상 같은 값)를 반환하는 것도 중요하다.
`useSyncExternalStore`는 snapshot이 이전과 `Object.is`로 같은지 비교하는데,
`true`는 언제나 `true === true`라 무한 리렌더가 나지 않는다.

## useState + useEffect가 아니라 이걸 쓴 이유

"브라우저인지 판별"하는 흔한 옛날 방식은 이랬다.

```tsx
// 레거시 방식
const [isClient, setIsClient] = useState(false); // 처음엔 false
useEffect(() => {
  setIsClient(true);
}, []); // 마운트 후 true로
return isClient;
```

이 라이브러리의 테스트(`useIsClient.spec.tsx`)는 두 방식을 직접 비교하며 차이를
못 박는다.

| | 새 방식 (`useSyncExternalStore`) | 레거시 (`useState`+`useEffect`) |
| --- | --- | --- |
| CSR 렌더 횟수 | **1번** | **2번** |
| `false`였던 순간 | **없음** (처음부터 true) | **있음** |

"false였던 순간"이 문제인 이유는, 그 찰나에 화면이 fallback으로 그려졌다가 실제
내용으로 깜빡하고 불필요한 리렌더가 한 번 더 발생하기 때문이다. 새 방식은
CSR에서 처음부터 곧장 true라 깜빡임과 헛렌더가 없다.

## SSR + 하이드레이션에서의 이점

SSR이 끼면 서버는 `false` 기반 HTML을 내보내고, 브라우저는 결국 `true` 기반
화면을 보여줘야 한다. 순진하게 처리하면 하이드레이션 미스매치 경고("서버
HTML과 클라 렌더가 다르다")가 터진다.

`useSyncExternalStore`는 바로 이 상황을 위해 설계된 훅이라, 서버 snapshot(`false`)과
클라 snapshot(`true`)이 다를 수 있음을 React가 **알고** 처리한다. 그래서 미스매치
경고 없이, 서버 HTML과 일관되게 하이드레이션한 뒤 올바른 클라 값으로 넘어간다.
`useEffect` 방식에는 이 "React가 인지하는" 처리가 없어 상황에 따라 미스매치가 나기
쉽다.

정리하면 새 방식의 이점은 두 갈래다.

- **CSR**: 렌더 1번, 깜빡임 없음(테스트가 증명)
- **SSR**: 하이드레이션 미스매치 없이 안전

## ClientOnly — useIsClient의 컴포넌트 버전

`useIsClient`가 값(boolean)을 주는 훅이라면, `ClientOnly`는 그 값으로 분기까지
해주는 컴포넌트다. 본체는 딱 한 줄이다.

```tsx
({ children, fallback }: ClientOnlyProps) => (
  <>{useIsClient() ? children : fallback}</>
);
```

- `useIsClient()`가 `true`(브라우저)면 `children`을,
- `false`(서버)면 `fallback`을 렌더한다.

"서버냐 클라냐" 판별의 어려운 부분(`useSyncExternalStore`, 하이드레이션 미스매치
회피)은 전부 `useIsClient` 안에서 처리되고, `ClientOnly`는 그 결과로 삼항 분기만
한다. 그래서 이렇게 짧다. `<>...</>`(Fragment)로 감싼 것은 추가 DOM 없이
"둘 중 하나"를 반환하기 위해서다.

`ClientOnly`도 [Object.assign 패턴](/research/suspensive/05-object-assign-pattern)으로
만들어져 `displayName`과 `.with`을 함께 단다.

## ClientOnly vs Suspense의 clientOnly

이름이 비슷해 헷갈리지만, `Suspense`의 `clientOnly` 옵션이 내부적으로 이
`ClientOnly`를 쓴다.

```text
Suspense clientOnly ─(내부)─► <ClientOnly><Suspense/></ClientOnly> ─(내부)─► useIsClient()
```

| 상황 | 쓸 것 |
| --- | --- |
| 값(boolean)만 필요, 직접 분기하고 싶다 | `useIsClient()` |
| JSX에서 "이 부분만 클라 전용"으로 감싸고 싶다 (비동기 아님) | `<ClientOnly>` |
| 비동기 로딩(Suspense)까지 하면서 SSR을 건너뛰고 싶다 | `<Suspense clientOnly>` |

핵심 차이는 이렇다. `ClientOnly`는 "서버냐 클라냐"만 다루고 로딩(비동기)과는
무관하다. 반면 `Suspense clientOnly`는 그 위에 비동기 로딩 처리까지 얹은
것이다.

## 3줄 요약

1. "서버냐 클라냐"를 `if (typeof window)` 대신 `useSyncExternalStore`의 서버/클라
   snapshot 분리로 표현한다.
2. 상수 저장소라 `subscribe`는 `noop`만 반환한다.
3. `useState`+`useEffect` 대비 CSR 렌더 1번·깜빡임 없음, SSR 미스매치 없음을
   테스트로 못 박아 두었다. `ClientOnly`는 이 훅을 삼항 한 줄로 감싼 것이다.
