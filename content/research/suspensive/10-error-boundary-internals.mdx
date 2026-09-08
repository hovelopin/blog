---
title: "내부 뜯어보기 ⑥: ErrorBoundary는 왜 337줄로 커졌나"
---

`ErrorBoundary`는 이 라이브러리에서 가장 큰 파일(337줄)이다. 다른
컴포넌트(`Suspense`, `Delay` 등)는 다 함수인데 `ErrorBoundary`만 클래스가
핵심이다. 그 이유부터 짚고 구조를 7개 층으로 나눠 본다.

- **소스**: `packages/react/src/ErrorBoundary.tsx` (337줄)
- **의존 부품**: `ErrorBoundaryGroupContext`, `SuspensiveError`, `hasResetKeysChanged`
- **함께 export**: `useErrorBoundary`, `useErrorBoundaryFallbackProps`, `ErrorBoundary.Consumer`

## 왜 유독 복잡한가 — 에러 잡기는 클래스 컴포넌트만 가능하다

React에서 렌더 중 발생한 에러를 잡는 방법은 오직 클래스 컴포넌트의 두
메서드뿐이다. 훅 버전이 없다.

- `static getDerivedStateFromError(error)` — 에러를 잡아 state를 바꾸기(fallback
  렌더 트리거)
- `componentDidCatch(error, info)` — 에러 부수효과(로깅 등)

그래서 `ErrorBoundary`만 클래스가 핵심이고, 이 위에 편의 기능(shouldCatch,
resetKeys, 그룹, 훅)을 얹느라 커졌다.

## 층 1. 핵심 클래스 BaseErrorBoundary — 진짜 에러를 잡는 곳

```tsx
class BaseErrorBoundary extends Component {
  static getDerivedStateFromError(error) {
    return { isError: true, error }; // ① 에러 잡으면 state를 error 모드로
  }
  componentDidCatch(error, info) {
    this.props.onError?.(error, info); // ② 부수효과(onError 콜백)
  }
  componentDidUpdate(prevProps, prevState) {
    // ③ resetKeys가 바뀌었으면 자동 reset
    if (
      isError &&
      prevState.isError &&
      hasResetKeysChanged(prevProps.resetKeys, resetKeys)
    )
      this.reset();
  }
  reset = () => {
    this.props.onReset?.(); // ④ reset: onReset 부르고 state 초기화
    this.setState(initialErrorBoundaryState);
  };
}
```

- ① 하위에서 에러가 throw되면 React가 `getDerivedStateFromError`를 불러
  `{isError:true, error}`로 만들고, 다음 렌더에서 fallback을 그린다.
- ② `componentDidCatch`는 렌더가 아니라 부수효과용이라 `onError` 콜백만 호출한다.
- ③④ reset 메커니즘이다. `resetKeys` 배열이 바뀌면 자동 복구한다.

`getDerivedStateFromError`(state 만들기, 순수)와 `componentDidCatch`(부수효과)의
역할 분담이 React 공식 API 그대로다.

## 층 2. render()의 결정 트리 — 에러를 "다시 던지는" 경우들

여기가 제일 촘촘하다. 에러가 났어도 무조건 fallback을 그리는 게 아니라, 몇
가지는 다시 throw(=상위로 넘김)한다.

```tsx
if (isError) {
  if (error instanceof SuspensiveError) throw error; // (a) 라이브러리 내부 제어용 에러 → 안 잡음
  if (error instanceof ErrorInFallback) throw error.originalError; // (b) fallback이 터진 것 → 상위로
  if (!shouldCatchError(shouldCatch, error)) throw error; // (c) shouldCatch가 "내 것 아님"이라 함
  if (typeof fallback === "undefined") {
    throw error;
  } // (d) fallback 없으면 못 그림 → 상위로

  const Fallback = fallback; // 여기까지 왔으면 fallback 렌더
  childrenOrFallback = (
    <FallbackBoundary>
      {typeof Fallback === "function" ? (
        <Fallback error={error} reset={this.reset} />
      ) : (
        Fallback
      )}
    </FallbackBoundary>
  );
}
```

"에러를 잡을지 말지"를 네 단계로 거친다. 특히 (c) `shouldCatch`와 (b)
`ErrorInFallback`이 이 라이브러리의 특별한 부분이다(층 3·4). fallback이 함수면
`<Fallback error reset />`으로, JSX면 그대로 렌더한다.

## 층 3. shouldCatch — "이 에러만 잡고 나머진 상위로"

기본은 다 잡지만(`true`), 특정 에러만 골라 잡을 수 있다.

```tsx
type ErrorMatcher = boolean | ErrorConstructor | TypeGuard | Validator;
// 예: <ErrorBoundary shouldCatch={NetworkError} .../>  → NetworkError만 잡고 나머진 통과
```

`matchError`가 matcher 종류별로 처리한다.

- **boolean** → 그대로
- **에러 생성자**(`NetworkError`) → `error instanceof NetworkError`
- **타입가드/검증 함수** → 함수 호출 결과

배열도 되고(`[A, B]` 중 하나라도 매치), 트랜스파일로 프로토타입 체인이 깨진
경우까지 `try/catch`로 방어한다. 타입 레벨 `InferError`가 shouldCatch를 보고
fallback의 error 타입을 자동 추론해 준다(고급 TS). 못 잡는 에러는 (c)에서 상위
경계로 넘어간다.

## 층 4. FallbackBoundary + ErrorInFallback — fallback이 터지는 사고 방지

미묘하지만 중요한 안전장치다. fallback 자체가 에러를 던지면 어떻게 될까?
같은 경계가 또 그걸 잡아 또 fallback을 그리려다 무한 루프에 빠질 수 있다.

```tsx
class FallbackBoundary extends Component {
  componentDidCatch(originalError) {
    throw originalError instanceof SuspensiveError
      ? originalError
      : new ErrorInFallback(originalError); // fallback에서 난 에러를 특별 포장
  }
}
```

- fallback을 `<FallbackBoundary>`로 감싸서, fallback 렌더 중 난 에러를 잡아
  `ErrorInFallback`으로 포장해 다시 던진다.
- 그러면 `BaseErrorBoundary.render`의 (b)가 이걸 알아보고 원본 에러를 상위 경계로
  넘긴다(자기가 또 잡지 않음).

즉 "fallback이 실패하면 나 말고 부모가 처리해라"를 구현해 무한 루프를 막는다.
순진한 ErrorBoundary 구현과 크게 다른 점이다.

## 층 5. 바깥 ErrorBoundary (forwardRef 함수) — 왜 클래스를 함수로 또 감쌌나

클래스는 에러를 잘 잡지만 훅(useContext 등)을 못 쓴다. 그래서 함수 컴포넌트로 한
번 더 감싸 훅으로 할 일을 처리한다.

```tsx
export const ErrorBoundary = Object.assign(
  forwardRef(function ErrorBoundary(props, ref) {
    const group = useContext(ErrorBoundaryGroupContext) ?? { resetKey: 0 }; // ① 그룹 연동
    const baseErrorBoundaryRef = useRef(null);
    useImperativeHandle(ref, () => ({
      reset: () => baseErrorBoundaryRef.current?.reset(),
    })); // ② ref로 reset 노출

    return (
      <BaseErrorBoundary
        resetKeys={[group.resetKey, ...(resetKeys || [])]} // ③ 그룹 resetKey를 앞에 합침
        ref={baseErrorBoundaryRef}
        ...
      >
        {children}
      </BaseErrorBoundary>
    );
  }),
  { displayName, with, Consumer },
);
```

역할 분담이 명확하다.

- **클래스(BaseErrorBoundary)** = 에러 잡기 (훅 못 씀)
- **함수 래퍼** = 훅으로 하는 접착 작업 3가지:
  - ① `ErrorBoundaryGroupContext`를 읽어 그룹의 `resetKey` 가져오기
  - ② `useImperativeHandle`로 부모가 `ref.reset()`을 호출할 수 있게 하기
  - ③ 그룹 resetKey를 `resetKeys` 맨 앞에 합쳐, 그룹이 리셋되면 이 경계도 자동
    리셋되게 하기(다음 장 `ErrorBoundaryGroup`과의 연결점)

익숙한 `Object.assign`으로 `displayName`, `with`,
`Consumer`(render-prop)를 부착한다.

## 층 6. resetKeys — 자동 복구 트리거

```tsx
export const hasResetKeysChanged = (a = [], b = []) =>
  a.length !== b.length || a.some((item, i) => !Object.is(item, b[i]));
```

`resetKeys` 배열의 원소가 하나라도 바뀌면(`Object.is` 비교) `componentDidUpdate`에서
자동으로 `reset()`한다. 예를 들어 `resetKeys={[crash]}`이면 `crash`가 바뀔 때
에러 상태를 풀고 다시 시도한다.

## 층 7. Context + 훅 — prop drilling 없이 error/reset 접근

render가 `<ErrorBoundaryContext.Provider value={{...state, reset}}>`로 감싸므로,
하위에서 훅으로 꺼낼 수 있다.

- **`useErrorBoundary()`** → `{ setError }` 반환. children에서 명령형으로 에러를
  발생시킬 때(비동기 에러 등을 경계로 던지기) 쓴다. `setError(e)` → state 바꿔 →
  다음 렌더에 throw → 경계가 잡음.
- **`useErrorBoundaryFallbackProps()`** → `{ error, reset }`. fallback 안에서 prop
  drilling 없이 error/reset에 접근한다.
- **`ErrorBoundary.Consumer`** → 위 `useErrorBoundary`를 render-prop으로 제공한다.

`SuspensiveError.assert(...)`로 "이 훅은 반드시 ErrorBoundary 안에서 써야 한다"를
런타임에 강제한다.

## 전체 그림

```text
<ErrorBoundary> (forwardRef 함수 래퍼) ── 훅 담당: 그룹 연동 / ref.reset / resetKeys 병합
      │
      ▼
  BaseErrorBoundary (클래스) ── 에러 담당: getDerivedStateFromError / componentDidCatch / reset
      │
      ├─ 에러 없음 → children (+ ErrorBoundaryContext.Provider)
      └─ 에러 있음 → render 결정 트리
            (a) SuspensiveError    → 다시 throw
            (b) ErrorInFallback    → 원본을 상위로 throw   ← FallbackBoundary가 만든 것
            (c) shouldCatch 불일치  → 다시 throw
            (d) fallback 없음       → 다시 throw
            else → <FallbackBoundary>{fallback}</FallbackBoundary>
```

## 설계 철학 3줄 요약

1. 에러 잡기가 **클래스 전용**이라 `BaseErrorBoundary`(클래스, 에러) +
   `ErrorBoundary`(함수, 훅)의 **2층 구조**다.
2. `shouldCatch`(선택적 포착) + `ErrorInFallback`(fallback 사고 방지) +
   `resetKeys`/그룹(복구)으로 순진한 ErrorBoundary를 실전용으로 강화한다.
3. Context + 훅(`useErrorBoundary` 등)으로 prop drilling 없이 error/reset을
   노출한다.
