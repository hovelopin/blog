---
title: "내부 뜯어보기 ④: Suspense 래퍼는 28줄로 무엇을 하나"
---

`@suspensive/react`의 `Suspense`는 겨우 28줄이다. React가 이미 `<Suspense>`를
제공하는데 왜 감쌌는지가 핵심이다. 그 "왜"가 코드 한 줄 한 줄의 이유가 된다.

- **소스**: `packages/react/src/Suspense.tsx` (28줄)
- **의존 부품**: `defineSuspense`, `SuspenseDefaultPropsContext`, `ClientOnly`, `useIsClient`

## 존재 이유 한 문장

> React 기본 `<Suspense>`를 그대로 쓰되, ① 기본 fallback을 전역으로 주입할 수
> 있게 하고 ② `clientOnly` 옵션 하나로 "서버에선 안 그리고 클라이언트에서만
> 그리기"를 켤 수 있게 만든 얇은 래퍼.

## 'use client'와 타입

파일 맨 위의 `'use client'`는 RSC(예: Next.js App Router) 환경에서 "이 파일은
클라이언트 컴포넌트"라고 선언하는 지시어다. `clientOnly`가 클라이언트 훅
`useSyncExternalStore`를 쓰기 때문에 반드시 필요하다. 이 라이브러리가 Next.js를
1급으로 지원하려고 설계됐다는 흔적이다.

```tsx
export interface SuspenseProps extends ReactSuspenseProps {
  clientOnly?: boolean;
}
```

`extends ReactSuspenseProps`로 React Suspense의 모든 prop(`fallback`, `children`,
`name`)을 그대로 물려받고 `clientOnly` 하나만 추가한다. 즉 **React Suspense의
완전한 상위 호환**이다. (`SuspenseProps as ReactSuspenseProps` 별칭을 쓴 것도
React 원본을 확장하겠다는 신호다.)

## 본체 함수 — 구조 분해

```tsx
({ clientOnly, fallback, children, name, ...rest }: SuspenseProps) => {
```

네 개는 이름으로 꺼내고 나머지는 `...rest`로 모은다. 이 넷을 따로 꺼내는 이유는
각각 특별한 취급이 필요해서다.

| prop | 따로 꺼내는 이유 |
| --- | --- |
| `clientOnly` | React Suspense엔 없는 옵션. "어떤 Suspense를 쓸지" 결정에만 쓰고 DOM엔 안 넘김 |
| `fallback` | "안 넘겼으면 전역 기본값으로 대체" 로직 필요 |
| `children` | Suspense가 감쌀 실제 내용 |
| `name` | 명시적으로 다시 넘겨주려 분리 |
| `...rest` | 모르는 prop도 React Suspense에 그대로 전달 (방어적 설계) |

`...rest`로 남은 걸 통째로 넘기는 것은 "내가 모르는 prop도 그대로 전달"하는
것이다. React가 나중에 Suspense에 새 prop을 추가해도 이 래퍼를 고칠 필요가
없다.

## 전역 기본값 읽기

```tsx
const defaultProps = useContext(SuspenseDefaultPropsContext);
```

[DefaultProps](/research/suspensive/07-default-props) 장에서 본 그 Context의
소비자 쪽이다. `DefaultPropsProvider`로 감싸지 않으면 기본값이 전부
`undefined`라 아무 영향이 없고 `fallback`을 채워 주면 그 아래 모든 `<Suspense>`가
fallback을 생략해도 그 값을 쓴다.

## 핵심 — defineSuspense로 "어떤 Suspense를 쓸지" 고르기

```tsx
const DefinedSuspense = defineSuspense({
  defaultPropsClientOnly: defaultProps.clientOnly, // 전역 설정
  componentPropsClientOnly: clientOnly, // 개별 prop
});
```

```tsx
// utils/defineSuspense.tsx
export const SuspenseClientOnly = (props) => (
  <ClientOnly fallback={props.fallback}>
    <Suspense {...props} />
  </ClientOnly>
);

export function defineSuspense({
  defaultPropsClientOnly,
  componentPropsClientOnly,
}) {
  return (componentPropsClientOnly ?? defaultPropsClientOnly)
    ? SuspenseClientOnly
    : Suspense;
}
```

동작은 이렇다.

1. `componentPropsClientOnly ?? defaultPropsClientOnly` → **개별 우선, 없으면
   전역**(`??`는 왼쪽이 null/undefined일 때만 오른쪽). 이게 우선순위 규칙 "개별 >
   전역"이다.
2. 결과가 truthy면 `SuspenseClientOnly`(ClientOnly로 한 번 더 감싼 버전)를
   반환한다.
3. 아니면 React 기본 `Suspense`를 그대로 반환한다.

여기서 핵심은 `defineSuspense`가 값이 아니라 **컴포넌트 자체를 골라서
반환**한다는 점이다. 그래서 `DefinedSuspense`는 `clientOnly`가 꺼지면 그냥 React
`Suspense`(군더더기 0), 켜지면 `<ClientOnly><Suspense/></ClientOnly>`가 된다.
컴포넌트를 변수에 담아 골라 쓰는 방식 덕분에 return 문에서 조건 분기가 사라지고
한 줄로 깔끔해진다.

> `defineSuspense.tsx`의 함수 오버로드 세 개는 런타임 로직이 아니라 타입
> 힌트다. "`clientOnly: true`가 확실하면 반환 타입이 `SuspenseClientOnly`"라고
> TS에 알려주는 용도이고, 실제 로직은 구현부 한 줄뿐이다.

## clientOnly는 어떻게 서버/클라를 구분하나

`SuspenseClientOnly` → `ClientOnly` → `useIsClient` 순으로 따라가면 원리가
보인다. 이 부분의 자세한 원리는
[서버/클라 판별](/research/suspensive/06-client-detection) 장에서 다뤘다.
요약하면, `useIsClient`의 `useSyncExternalStore` 트릭으로 서버에선 `false`(fallback을
HTML에 담음), 브라우저 하이드레이션에선 `true`(children을 그림)가 되어, 미스매치
경고 없이 "서버엔 fallback, 브라우저에서만 진짜 내용"이 구현된다.

## return — fallback 기본값 처리

```tsx
return (
  <DefinedSuspense
    {...rest}
    fallback={fallback === undefined ? defaultProps.fallback : fallback}
    name={name}
  >
    {children}
  </DefinedSuspense>
);
```

- `DefinedSuspense`는 앞에서 고른 컴포넌트(React Suspense 또는 SuspenseClientOnly)다.
- `fallback`은 개별값을 줬으면 그걸, 안 줬으면 전역 기본값을 쓴다. 여기서도
  **개별 > 전역**이다.
- **`??`가 아니라 `=== undefined` 삼항인 이유**가 세심하다. `fallback={null}`("로딩
  중 아무것도 안 보이기")처럼 `null`을 의도적으로 넘길 수 있다. `??`는 `null`도
  기본값으로 덮어써 버리므로, `undefined`만 골라내 "명시적 null" 의도를 존중한다.

## .with — 정적 메서드 (HOC 헬퍼)

`Suspense`는 [Object.assign 패턴](/research/suspensive/05-object-assign-pattern)으로
`.with` 메서드를 함께 답니다. "어떤 컴포넌트를 Suspense로 미리 감싼 새 컴포넌트를
만들어주는 공장"(HOC 패턴)이다.

```tsx
// 매번 감싸는 대신
const SuspendedProfile = Suspense.with({ fallback: <Spinner /> }, UserProfile);
// <SuspendedProfile userId={1} /> 로 바로 사용 (자동으로 Suspense가 붙음)
```

inline `<Suspense>`와 `.with`은 **결과가 완전히 동일**하다. 차이는 "감싸는 책임이
어디에 있느냐"뿐이다. inline은 쓰는 쪽이 매번 감싸고, `.with`은 만드는 쪽이 한 번
감싸 완성품으로 넘긴다.

| 상황 | inline `<Suspense>` | `Suspense.with(...)` |
| --- | --- | --- |
| 일회성 사용 | ✅ 직관적, 경계가 눈에 보임 | ❌ 과함 |
| 여러 번 재사용 | ❌ 같은 래핑 반복 | ✅ 한 번 정의 |
| 경계를 컴포넌트에 고정 | ❌ 쓰는 쪽 책임(누락 위험) | ✅ 정의에 포함 |
| 여러 경계 합성 | ❌ JSX 계단 중첩 | ✅ 함수처럼 조립 |
| 경계가 "보이는" 명확함 | ✅ JSX에 그대로 | ⚠️ 컴포넌트 안에 숨음 |

여러 경계를 겹칠 때 `.with`은 함수 합성처럼 평탄해집니다.

```tsx
// inline — 깊은 계단 중첩
<ErrorBoundary fallback={<Retry />}>
  <Suspense fallback={<Skeleton />}>
    <Delay ms={200}>
      <Profile />
    </Delay>
  </Suspense>
</ErrorBoundary>;

// .with — 완성품으로 조립
const Profile = ErrorBoundary.with(
  { fallback: <Retry /> },
  Suspense.with({ fallback: <Skeleton /> }, Delay.with({ ms: 200 }, ProfileBase)),
);
```

단, `.with`은 경계를 숨기므로 "이 컴포넌트가 Suspense로 감싸졌나?"가 JSX에서 안
보인다. 일회성이거나 경계를 드러내고 싶으면 inline이 더 낫다. `.with`은 필수가
아닌 선택형 편의 문법이다.

## 전체 흐름 요약

```text
<Suspense clientOnly fallback={<Spinner/>}>
        │
        ▼
① SuspenseDefaultPropsContext 읽기  ── 전역 기본값(DefaultPropsProvider)
        │
        ▼
② defineSuspense(개별 clientOnly ?? 전역 clientOnly)
        │
        ├─ true  → SuspenseClientOnly = <ClientOnly><Suspense/></ClientOnly>
        │              └ useIsClient() = useSyncExternalStore
        │                  서버 false→fallback / 클라 true→children
        │
        └─ false → 그냥 React <Suspense>
        │
        ▼
③ fallback = 개별값 ?? (undefined일 때만) 전역값   // null은 존중
        │
        ▼
   최종 렌더
```

## 설계 철학 3줄 요약

1. **React Suspense의 상위 호환** — 기존 prop을 다 받고 `clientOnly`만 추가한다.
2. **개별 > 전역** 우선순위를 `clientOnly`와 `fallback` 양쪽에서 일관되게
   적용한다.
3. **컴포넌트를 값처럼 골라 쓰기**(`defineSuspense`)로 조건 분기를 return 밖으로 빼
   코드를 단순화한다.
