---
title: "내부 뜯어보기 ③: DefaultProps로 전역 기본값 주입하기"
---

`Suspense`와 `Delay`는 fallback이나 `ms` 같은 기본값을 하위 트리 전체에 한 번에
심을 수 있다. 위와 같은 설정을 담당하는것이 `DefaultProps`다.

## 요약

> Suspensive 컴포넌트(`Suspense`·`Delay`)의 기본 props를 하위 트리에 주입하는
> 도구. 설정을 담는 `DefaultProps`(클래스)와 그걸 Context로 뿌리는
> `DefaultPropsProvider`(컴포넌트) 두 조각으로 되어 있다.

## DefaultProps

`DefaultProps.tsx`는 아래와 같이 구성되어 있다.

```tsx
// ① DefaultProps — "설정값을 담는 그릇" (class)
const defaultProps = new DefaultProps({
  Suspense: { fallback: <Skeleton />, clientOnly: false },
  Delay: { ms: 1000, fallback: <Spinner /> },
});

// ② DefaultPropsProvider — "그 설정을 하위 트리에 뿌리는 Provider" (component)
<DefaultPropsProvider defaultProps={defaultProps}>
  <App />
</DefaultPropsProvider>;
```

## DefaultProps 클래스

```tsx
export class DefaultProps {
  Suspense?: ContextType<typeof SuspenseDefaultPropsContext>;
  Delay?: ContextType<typeof DelayDefaultPropsContext>;

  constructor(defaultProps: DefaultProps = {}) {
    if (
      process.env.NODE_ENV === "development" &&
      typeof defaultProps.Delay?.ms === "number"
    ) {
      SuspensiveError.assert(
        defaultProps.Delay.ms > 0,
        Message_DefaultProp_delay_ms_should_be_greater_than_0,
      );
    }
    this.Suspense = defaultProps.Suspense;
    this.Delay = defaultProps.Delay;
  }
}
```

## DefaultPropsProvider 컴포넌트

```tsx
export const DefaultPropsProvider = ({
  defaultProps,
  children,
}: DefaultPropsProviderProps) => (
  <DelayDefaultPropsContext.Provider value={defaultProps.Delay ?? {}}>
    <SuspenseDefaultPropsContext.Provider value={defaultProps.Suspense ?? {}}>
      {children}
    </SuspenseDefaultPropsContext.Provider>
  </DelayDefaultPropsContext.Provider>
);
```

`DefaultProps`에서 꺼낸 `Delay`/`Suspense` 설정을 각각의 Context Provider
`value`로 넣는다. 설정이 없으면 `?? {}`로 빈 객체를 넣어 "기본값 없음"을
표현한다.

이 Context가 바로 다음 장의 `Suspense` 본체에서 읽는 Context다.

```tsx
const defaultProps = useContext(SuspenseDefaultPropsContext);
```

```text
DefaultPropsProvider ──(SuspenseDefaultPropsContext.Provider로 값 넣음)──► 생산자
        │
        ▼
<Suspense> ──(useContext(SuspenseDefaultPropsContext)로 값 읽음)──► 소비자
```

즉 `DefaultPropsProvider`는 생산자(Provider), `Suspense`/`Delay`는 소비자(Consumer)이고 그 사이를 잇는 통로가 `SuspenseDefaultPropsContext` / `DelayDefaultPropsContext`다.

## 스코프와 우선순위

- **전역 1회가 아니라 하위 트리 스코프**다. Provider로 감싼 그 아래의
  `Suspense`/`Delay`만 영향을 받는다. 구역마다 다른 기본값도 줄 수 있다.
- **개별 props가 항상 이긴다.**

```tsx
fallback={fallback === undefined ? defaultProps.fallback : fallback}
```

개별 `<Suspense fallback={...}>`을 주면 그게 우선이고 안 줬을 때만 Provider
기본값이 쓰인다. "개별 > 전역"이 여기서도 일관된다.

## 3줄 요약

1. **설정(class)과 전달(Provider)을 분리**한다. 설정은 재사용 가능한 데이터로,
   전달은 Context 스코프로 다룬다.
2. `Suspense`/`Delay`가 이미 `useContext`로 읽던 Context를 채워주는 생산자
   역할이다. 소비자와 생산자가 짝을 이룬다.
3. "개별 > 전역" 우선순위와 dev 검증으로, 전역 기본값을 안전하고 예측 가능하게
   만든다.
