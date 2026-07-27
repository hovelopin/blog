---
title: "SSR을 위한 리액트 API 살펴보기"
---

`react-dom/server`와 `react-dom/static`이 제공하는 서버 렌더 API를 정리하여 SSR을
하기 위해 React에서는 어떤 API를 제공하는지 살펴보자.

---

## 0. 한 장 요약

| API | 모듈 | 반환 | Suspense 대기 | hydration 마커 | 상태 |
| --- | --- | --- | --- | --- | --- |
| `renderToString` | `react-dom/server` | `string` | ❌ | O | 현역 |
| `renderToStaticMarkup` | `react-dom/server` | `string` | ❌ | **X** | 현역 |
| `renderToPipeableStream` | `react-dom/server` | `{ pipe, abort }` | ✅ | O | **Node 표준** |
| `renderToReadableStream` | `react-dom/server` | `Promise<ReadableStream>` | ✅ | O | **Edge 표준** |
| `prerenderToNodeStream` | `react-dom/static` | `Promise<{ prelude }>` | ✅ | O | SSG용 |
| `prerender` | `react-dom/static` | `Promise<{ prelude }>` | ✅ | O | SSG용 (Web) |
| `resumeToPipeableStream` | `react-dom/server` | `{ pipe, abort }` | ✅ | O | 파셜 (PPR), Node |
| `resume` | `react-dom/server` | `Promise<ReadableStream>` | ✅ | O | 파셜 (PPR), Edge |
| `renderToNodeStream` | — | — | — | — | **React 19에서 제거** |
| `renderToStaticNodeStream` | — | — | — | — | **React 19에서 제거** |

---

## 1. `renderToString`

```tsx
const html = renderToString(<App todos={todos} />)
```

renderToString은 React 트리를 HTML 문자열로 렌더링한다.

**특징**

- 브라우저에서 동작하는 메서드이지만 클라이언트 코드에서 사용하는것은 권장하지
  않는다. (<https://ko.react.dev/reference/react-dom/server/renderToString#removing-rendertostring-from-the-client-code>)

    - 클라이언트에서 `react-dom/server`를 가져오면 불필요하게 번들 크기가 커지기
      때문이다.

- 동기 함수로 동작하고 반환되는 순간 HTML이 완성돼 있다.
- 렌더가 전부 끝나야 첫 바이트가 나간다 → 느린 페이지(API 요청이 오래걸리는 페이지)
  일수록 TTFB가 나쁘다. (<https://developer.mozilla.org/ko/docs/Glossary/Time_to_first_byte>)
- HTML만 반환하기 때문에 이벤트 핸들러가 붙은 코드들은 전부 제거되어 반환된다.

    - 이유 : 함수는 기본적으로 직렬화되지 않는다. 함수는 코드 텍스트만 있는 게
      아니라 클로저를 같이 들고 다니기 때문에 그 환경을 전부 재구성할 수 없다.

    - ```jsx
      function Todos() {
        const handleClick = () => {
          console.log("Toggle");
        }

        return (
          <ul>
            <li onClick={handleClick}>할일</li>
          <ul/>
        )
      }

      ...
      const result = renderToString(<Todos />)
      ...

      // result
      // <ul><li>할일</li></ul>
      ```

- renderToString은 Suspense 지원에 한계가 있다. 따라서 컴포넌트가 중단된다면
  `renderToString`는 즉시 해당 폴백을 HTML로 보낸다.

    - ```jsx
      function Todos() {
        const handleClick = () => {
          console.log("Toggle");
        }

        return (
          <ul>
            <li onClick={handleClick}>할일</li>
            <Suspense fallback={<p className="loading">할 일 목록 불러오는 중…</p>}>
              <TodoPromise />
            </Suspense>
          <ul/>
        )
      }

      ...
      const result = renderToString(<Todos />)
      ...

      // result
      // <ul><li>할일</li><p>할 일 목록 불러오는 중...</p></ul>
      ```

    - 실제 renderToString을 활용하면서 내부적으로 Suspense 경계를 쓸 경우에는 server측
      console에 에러가 발생한다. ( The server used "renderToString" which does not
      support Suspense. If you intended for this Suspense boundary to render the
      fallback content on the server consider throwing an Error somewhere within
      the Suspense boundary. If you intended to have the server wait for the
      suspended component please switch to **"renderToPipeableStream"** which
      supports Suspense on the server" )

---

## 2. `renderToStaticMarkup`

```tsx
const html = renderToStaticMarkup(<App todos={todos} />)
```

renderToStaticMarkup은 React 트리를 hydration용 마커가 없는 순수 HTML 문자열로
렌더링한다.

**특징**

- hydration을 하지 않을 정적 콘텐츠 전용이다. 이메일 템플릿, 정적 사이트 생성처럼
  JS 없이 HTML만 있으면 되는 결과물에 쓴다.
- renderToString처럼 동기 함수이고, 반환되는 순간 HTML이 완성돼 있다. 렌더가 전부
  끝나야 첫 바이트가 나가는 것도 동일하다.
- renderToString과 마찬가지로 HTML만 반환하므로 이벤트 핸들러는 전부 제거되어
  반환된다.

**renderToString과의 비교**

renderToString과의 결정적 차이는 React가 hydration을 위해 심는 부가 정보(`<!-- -->`
텍스트 경계 마커, `<!--$-->` 같은 Suspense 경계 마커 등)를 전부 빼고 깨끗한 HTML만
낸다는 점이다. 그래서 출력이 더 가볍지만, 이 마크업에 hydrateRoot를 붙이면 안 된다.
(<https://ko.react.dev/reference/react-dom/server/renderToStaticMarkup#caveats>) 경계
정보가 없어 React가 트리를 다시 붙일 때 어긋나거나 경고를 낸다.

아래 예시를 살펴보자.

```jsx
function Todos() {
  return <ul><li>{"할"}{"일"}</li></ul>
}
```

여기서 `{"할"}`, `{"일"}`은 리터럴이지만 JSX에서 별개의 표현식 자식 2개로 들어간다.
즉 `<li>`의 children이 `["할", "일"]` — 인접한 텍스트 노드가 2개인 경우다. 브라우저는
연속된 텍스트를 하나로 합쳐버리므로, hydration 때 이 둘의 경계를 복원하려면 표시가
필요하다. 이 조건에서 두 API의 결과물에 차이가 발생한다.

| **API** | **결과** |
| --- | --- |
| `renderToString(<Todos />)` | `<ul><li>할<!-- -->일</li></ul>` |
| `renderToStaticMarkup(<Todos />)` | `<ul><li>할일</li></ul>` |

renderToString은 hydration 때 `{"할"}`과 `{"일"}`의 경계를 맞추려고 `<!-- -->`를 끼워
넣지만, renderToStaticMarkup은 hydration을 안 하므로 그 마커를 빼고 순수한 할일만
낸다.

---

## 3. `renderToPipeableStream` ⭐

```jsx
const { pipe , abort } = renderToPipeableStream(<App todos={todos} />, options)
```

renderToPipeableStream은 React 트리를 Node.js 스트림으로 흘려보내며 렌더링한다.
React 19에서 제거된 renderToNodeStream의 대체자다.

**특징**

- pipe는 HTML을 제공된 쓰기 가능한 Node.js 스트림으로 출력한다. 스트리밍을
  활성화하려면 onShellReady에서, 클로러와 정적 생성을 사용하려면 onAllReady에서
  pipe를 호출하자.
- abort를 사용하면 서버 렌더링을 중단하고 나머지는 클라이언트에서 렌더링할 수 있다.
- Node.js 환경 전용이다. Node의 스트림 API(pipe)를 쓴다. Deno/Edge/Cloudflare
  Workers 같은 Web 표준 스트림 환경에서는 renderToReadableStream을 써야 한다.
- 반환값은 HTML도 Promise도 아니다. 호출 즉시 `{ pipe, abort }` 객체를 동기적으로
  반환한다. pipe는 준비된 결과를 스트림으로 내보내는 함수, abort는 렌더링을 중단하는
  함수다. 실제 출력은 함수 호출이 아니라 콜백을 통해 시작된다.
- 셸(shell)을 먼저 보내고 나머지를 이어 보낸다. `<Suspense>` 바깥의 정적인 부분(셸)이
  준비되면 그것부터 즉시 전송하고, Suspense 경계 안의 데이터가 준비되는 대로 나머지를
  스트림으로 이어 붙인다. 그래서 렌더가 전부 끝나기를 기다리는 renderToString과 달리
  첫 바이트가 훨씬 빨리 나가 TTFB가 좋다.
  (<https://developer.mozilla.org/ko/docs/Glossary/Time_to_first_byte>)
- Suspense를 서버에서 지원한다. renderToString이 하지 못했던, 컴포넌트가
  중단(suspend)됐을 때 서버에서 Promise가 풀리기를 기다렸다가 실제 내용을 스트림에
  이어 보내는 동작이 가능하다. 먼저 fallback을 내보내고, 데이터가 준비되면 인라인
  스크립트로 그 자리를 실제 내용으로 바꿔치기한다.

### 루트가 Fragment면 스트리밍이 동작하지 않는다.

renderToPipeableSteam에 형식에 맞게 작성했는데 셸과 목록이 **한꺼번에** 나오는 경우가
있다.

```jsx
return (
  <>
    <h1>{method}</h1>
    <Suspense fallback={<p>불러오는 중…</p>}>…</Suspense>
  </>
)
```

### 원인 — React 19의 preamble 단계

React 19부터 `<html>/<head>/<body>`를 컴포넌트 트리 안에서 렌더할 수 있게 됐다.
그래서 Fizz는 이 태그들을 어디로 hoisting할지, 즉 문서 서두(**preamble**)를 먼저
확정해야 한다.

```javascript
// react-dom-server.node.development.js:6035
task.formatContext.insertionMode < HTML_MODE
  ? createSuspenseBoundary(request, row, set, createPreambleState(), createPreambleState())
  : createSuspenseBoundary(request, row, set, null, null)
```

루트가 Fragment면 React 입장에선 아직 "문서 밖"(`insertionMode < HTML_MODE`)이다.
그래서 **아직 안 풀린 Suspense 경계가 나중에** `<head>`**나** `<body>`**를 렌더할지도
모른다**고 가정하고 preamble 추적을 켠다. 그 결과 pending 경계가 하나라도 남아 있는 한
`preparePreamble`이 `completedPreambleSegments`를 채우지 못하고, flush 함수는 초입에서
그냥 빠져나간다.

```javascript
// react-dom-server.node.development.js:8185
if (null === completedPreambleSegments) return;   // ← 셸 flush 자체가 보류
```

정리하면 이런 연쇄다.

```
루트가 Fragment
  → insertionMode < HTML_MODE
  → preamble 추적 ON
  → pending 경계가 남아 있는 동안 completedPreambleSegments === null
  → 셸 flush 보류 (fallback조차 안 나감)
```

### 해결

감싸는 순간 `HTML_MODE`로 들어가면서 preamble 추적이 꺼진다.

```jsx
// ✅ 엘리먼트로 감싸면 preamble 추적이 꺼진다
return (
  <div>
    <h1>{method}</h1>
    <Suspense fallback={<p>불러오는 중…</p>}>…</Suspense>
  </div>
)
```

renderToPipeableStream에서는 언제 스트리밍을 시작할지 콜백으로 고른다.
(<https://ko.react.dev/reference/react-dom/server/renderToPipeableStream>)

| **콜백** | **발화 시점** | **용도** |
| --- | --- | --- |
| onShellReady | 셸(Suspense 바깥)이 준비된 순간 | 일반적인 스트리밍 SSR. 셸부터 즉시 흘려보내 TTFB 최적화 |
| onAllReady | 모든 Suspense 내용까지 전부 준비된 순간 | 크롤러/정적 생성 등 완성본 전체가 필요할 때 |
| onShellError | 셸 렌더 중 에러 | 셸조차 못 만들었을때의 콜백 (예: 500에러) |
| onError | 렌더 중 에러 로깅 | 스트리밍 도중 발생한 에러 수집 |

Suspense 경계 **바깥**의 모든 것. 아래에서 `<h1>`과 안내 문구가 셸이고 `<Suspense>`
안쪽은 셸이 아니다.

```tsx
<h1>{method}</h1>
<p>헤더는 즉시 보이고…</p>
<Suspense fallback={<p>불러오는 중…</p>}>
  <TodoList todosPromise={todosPromise} />
</Suspense>
```

예시 코드를 살펴보자.

```jsx
import { renderToPipeableStream } from 'react-dom/server'

function handleRequest(req, res) {
  const { pipe } = renderToPipeableStream(<App />, {
    // ① 셸(Suspense 바깥)이 준비된 순간 호출된다
    onShellReady() {
      res.setHeader('Content-Type', 'text/html')
      pipe(res)   // 준비된 HTML을 응답으로 흘려보내기 시작 → 나머지는 자동으로 이어짐
    },

    // ② 셸조차 렌더하지 못했을 때 (심각한 에러)
    onShellError() {
      res.statusCode = 500
      res.send('<h1>Something went wrong</h1>')
    },

    // ③ 스트리밍 도중 발생한 에러 로깅
    onError(error) {
      console.error(error)
    },
  })
}

...

function App() {
  return (
    <html>
      <body>
        <h1>My App</h1>  {/* 셸 — 즉시 전송된다 */}

        <Suspense fallback={<p>로딩 중…</p>}>
          <Comments />   {/* 데이터를 기다리는 부분 — 준비되면 이어서 전송 */}
        </Suspense>
      </body>
    </html>
  )
}
```

동작 순서는 아래와 같다.

1. `<h1>My App</h1>`까지가 셸이다. 이게 준비되면 onShellReady가 호출되고, pipe(res)로
   즉시 브라우저에 전송된다. 사용자는 로딩중…과 함께 헤더를 바로 본다. ( TTFB 좋음 )
2. `<Comments />`의 데이터가 준비되면 React가 나머지 HTML을 같은 스트림에 이어서 보내
   로딩 중… 자리를 실제 내용으로 바꾼다.
3. 모든 내용이 다 나가면 스트림이 알아서 닫힌다.

> 핵심은 pipe(res) 한 줄로 스트리밍이 시작되고 나머지는 React가 알아서 이어붙인다는
> 점이다. renderToString처럼 전체가 완성되기를 기다리지 않는다.

---

## 4. `renderToReadableStream`

```jsx
const stream = await renderToReadableStream(<App />, options)
```

renderToReadableStream은 React 트리를 Web 표준 스트림(ReadableStream)으로 렌더링한다.
renderToPipeableStream과 하는 일(스트리밍 SSR)은 같지만, Node 스트림이 아니라 Web
Streams 표준을 쓴다는 점이 다르다.

**특징**

- Web 표준 스트림 환경 전용이다. Deno, Cloudflare Workers, Vercel Edge 같은 엣지
  런타임과 최신 브라우저를 위한 API다. Node.js 서버에서는 renderToPipeableStream을
  쓰는 게 기본이다. (Node에서도 변환해 쓸 수는 있다 — 아래 참고)
- 반환값이 Promise다. renderToPipeableStream이 `{ pipe, abort }`를 동기로 반환하고
  콜백(onShellReady)으로 시점을 잡았던 것과 달리, 이쪽은 `Promise<ReadableStream>`을
  반환하는 async 함수다. 그래서 await로 다룬다.
- await가 풀리는 순간 = 셸이 준비된 시점이다. 즉 `await renderToReadableStream(...)`이
  resolve되는 타이밍이 renderToPipeableStream의 onShellReady와 같다. 콜백 대신 await 뒤
  코드가 그 역할을 한다.
- 셸을 먼저 보내고 나머지를 이어 보낸다. 스트리밍 개념은 renderToPipeableStream과
  동일하다. 셸부터 즉시 나가므로 TTFB가 좋고, `<Suspense>` 안의 데이터가 준비되면
  스트림으로 이어붙는다. 서버 Suspense도 지원한다.
- 전체 완성본이 필요하면 stream.allReady를 기다린다. 반환된 스트림에는 allReady라는
  Promise가 달려 있다. pipeable의 onAllReady에 대응하며, 크롤러/정적 생성처럼 모든
  Suspense 내용까지 다 필요할 때 `await stream.allReady`로 기다린다.
- 에러 처리. 스트리밍 도중 에러는 onError 옵션으로 로깅하고, 셸 렌더 자체가 실패하면
  await가 reject되므로 try/catch로 잡는다. (콜백 onShellError 대신 예외로 온다.)

**가장 기본적인 형태 (엣지/Deno 스타일)**

```jsx
import { renderToReadableStream } from 'react-dom/server'

async function handleRequest(request) {
  const stream = await renderToReadableStream(<App />, {
    onError(error) {
      console.error(error)
    },
  })
  // 여기 도달 = 셸 준비 완료. 스트림을 그대로 Response에 실어 보낸다.
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
  })
}
```

Response에 ReadableStream을 그대로 넘길 수 있는 게 이 API의 핵심이다. 엣지 런타임의
fetch 핸들러가 Web 표준을 쓰기 때문에 변환 없이 바로 연결된다.

**renderToPipeableStream vs renderToReadableStream**

|  | **renderToPipeableStream** | **renderToReadableStream** |
| --- | --- | --- |
| 스트림 타입 | Node 스트림 | Web Streams 표준 |
| 반환 | `{ pipe, abort }` (동기, 콜백 기반) | `Promise<ReadableStream>` (async) |
| 셸 준비 시점 | onShellReady 콜백 | await가 resolve되는 지점 |
| 전체 완성 시점 | onAllReady 콜백 | `await stream.allReady` |
| 셸 에러 | onShellError 콜백 | await reject → try/catch |
| 주 환경 | Node.js 서버 | Edge / Deno / Workers / 브라우저 |

---

## 5. `prerenderToNodeStream`

```jsx
import { prerenderToNodeStream } from 'react-dom/static' // <-- server가 아닌 static에서 import

const { prelude } = await prerenderToNodeStream(<App />, options)
```

prerenderToNodeStream은 트리를 완전히 다 렌더한 정적 HTML을 Node 스트림으로 만들어
준다. 정적 사이트 생성(SSG)·프리렌더링을 위한 API이며, React 19에서 제거된
renderToStaticNodeStream의 대체재다.

**특징** (<https://ko.react.dev/reference/react-dom/static/prerenderToNodeStream>)

- Node.js 환경 전용이다. 결과를 Node 스트림(prelude)으로 준다. Web 표준 스트림
  환경(엣지/Deno)에서는 짝꿍인 prerender(react-dom/static)를 쓴다.
- 반환값은 Promise이고, await하면 이미 전부 완성돼 있다. renderToReadableStream은 셸이
  준비된 순간(onShellReady 타이밍)에 resolve됐지만, 이쪽은 모든 `<Suspense>` 내용까지
  전부 렌더가 끝난 뒤에 resolve된다. 즉 renderToPipeableStream의 onAllReady에 해당하는
  시점 하나만 있다. await가 풀렸을 땐 prelude 안에 완성된 문서 전체가 들어있다.
- "흘려보내는 스트림"이 아니라 "완성본을 담은 스트림"이다. 이름에 stream이 들어가지만,
  renderToPipeableStream처럼 셸을 먼저 보내고 나중에 이어붙이는 점진적 스트리밍이
  아니다. 데이터가 준비되기를 다 기다렸다가, 완성된 HTML을 스트림 형태로 내보낼 뿐이다.
  그래서 사용자에게 실시간으로 흘려보내 TTFB를 줄이는 용도가 아니라, 빌드 타임에 정적
  파일을 만들어 CDN에 올리는 용도다.
- 서버 Suspense를 지원한다. renderToStaticMarkup이 하지 못했던, Suspense 데이터를
  서버에서 기다렸다가 실제 내용으로 채우는 동작이 된다. 프리렌더는 어차피 전부
  기다리므로 fallback이 아니라 완성된 내용이 나온다.
- 결과 HTML은 hydration이 가능하다. renderToStaticMarkup이 경계 마커를 다 빼서
  hydration을 못 했던 것과 달리, prerender는 hydration에 필요한 마커를 포함한다. 그래서
  "정적으로 생성해 두고, 클라이언트에서 살려내는(hydrate)" 흐름에 쓸 수 있다.

**가장 기본적인 형태 (빌드 타임 SSG)**

```jsx
import { prerenderToNodeStream } from 'react-dom/static'
import { createWriteStream } from 'node:fs'

async function build() {
  const { prelude } = await prerenderToNodeStream(<App />, {
    bootstrapScripts: ['/main.js'],
  })
  // 여기 도달 = 모든 데이터까지 렌더 완료. prelude엔 완성된 HTML이 들어있다.
  prelude.pipe(createWriteStream('./index.html'))  // 정적 파일로 저장 → CDN 배포
}
```

> 핵심은 응답으로 흘려보내는 게 아니라 **파일로 떨어트린다는 점**이다. 요청마다 실시간
> 렌더하는 다른 API들과 목적 자체가 다르다.

---

## 6. Partial Prerendering - `prerender / resumeToPipeableStream`

```jsx
// ① 빌드 타임
const { prelude, postponed } = await prerender(<App />, options)
// ② 요청 타임
const stream = await resumeToPipeableStream(<App />, postponed, options)
```

파셜 렌더링은 단일 메서드가 아니라 2단계 쌍이다. "정적으로 미리 렌더할 수 있는 부분은
빌드 타임에 뽑아두고, 요청마다 달라지는 부분만 나중에 이어서 렌더"하는 방식이다. 한
페이지 안에서 정적 + 동적을 섞는다고 해서 partial이다.
(<https://ko.react.dev/reference/react-dom/server/resumeToPipeableStream>)

**왜 필요한가?**

지금까지 본 API는 페이지를 통째로 다뤘다:

- prerenderToNodeStream → 페이지 전체를 정적으로 (빠르지만 요청별 데이터를 못 넣음)
- renderToPipeableStream → 페이지 전체를 요청마다 동적으로 (유연하지만 매번 서버가 다
  렌더)

그런데 실제 페이지는 **대부분 거의 다 똑같고(헤더·레이아웃·정적 콘텐츠), 일부만
사용자마다 다름(장바구니·추천·로그인 상태)"**이다. 파셜 렌더링은 이 둘을 한 페이지에서
얻게 해준다. 정적 뼈대는 CDN에서 즉시, 동적 구멍만 요청 시 스트리밍

**동작 흐름**

1. 빌드 타임 — prerender
   정적으로 만들 수 있는 데까지 렌더한다. 요청 데이터에 의존해 지금 렌더할 수 없는
   경계를 만나면 에러를 내거나 기다리지 않고 그 자리를 "보류(postpone)" 하고 넘어간다.
   결과로 두 가지를 돌려준다:

    1. prelude — 완성된 정적 셸 HTML (구멍은 뚫린 채). CDN에 배포한다.
    2. postponed — 어디를 보류했는지 적힌 직렬화된 상태. 나중에 이어 렌더할 때 쓴다.

2. 요청 타임 — resume / resumeToPipeableStream
   CDN이 정적 prelude를 즉시 응답한다(TTFB 최고). 그 뒤 서버는 postponed 상태를 받아
   보류했던 구멍만 요청별 데이터로 렌더해서 스트림으로 이어 붙인다. 이미 렌더된 정적
   부분은 다시 렌더하지 않는다 — 딱 멈췄던 지점부터 재개(resume)한다.

**특징**

- prerender가 `{ prelude, postponed }`를 반환한다. 앞서 본 prerenderToNodeStream(prelude만)과
  달리, 보류 상태(postponed)가 하나 더 나온다. 보류된 게 없으면 postponed는 null이고 —
  그럼 그냥 완전 정적 페이지다.
- resume 계열은 "이어서 렌더"만 한다. 처음부터 렌더하지 않고, postponed 상태가 가리키는
  구멍만 채운다. 스트림 타입에 따라 나뉜다.

| **API** | **패키지** | **결과** |
| --- | --- | --- |
| resumeToPipeableStream | Server | Node 스트림으로 사용자에게 스트리밍 |
| resume | Server | Web 스트림(ReadableStream)으로 스트리밍 |
| resumeAndPrerenderToNodeStream | Static | 사용자에게 보내지 않고 다시 정적으로 재렌더 (캐시 예열·다단계 프리렌더용) |
| resumeAndPrerender | Static | 위의 Web 스트림판 |

서버 Suspense 위에서 동작한다. 보류되는 경계는 결국 `<Suspense>` 경계다. 정적으로 못
채우는 부분을 Suspense로 감싸 두면, 그 경계가 postpone 대상이 된다.

**보류(postpone)는 어떻게 표시하나**

경계를 보류시키는 트리거는 unstable_postpone인데, 이 stable 빌드(19.2.8)에서는 react가
이걸 public export로 노출하지 않는다. (방금 확인: `'unstable_postpone' in require('react')`
→ false.) 즉 prerender/resume 인프라는 다 들어있지만, 보류를 직접 트리거하는 API는 아직
**프레임워크용(experimental)**으로 열려 있다. 그래서 지금 이걸 소비하는 대표 주자가
**Next.js의 Partial Prerendering(PPR)**이다. 앱 코드에서 unstable_postpone을 직접
호출하기보다는, 프레임워크가 `<Suspense>` 경계를 보고 알아서 prerender/resume을
오케스트레이션하는 형태로 쓴다.

**개념 예시**

```jsx
// ── build.js : 빌드 타임에 정적 셸 생성 ──────────────
import { prerender } from 'react-dom/static'

const { prelude, postponed } = await prerender(<App />)
saveToCDN('shell.html', prelude)     // 정적 셸 → CDN
saveState('postponed.json', postponed)  // 보류 상태 → 서버가 보관

// ── server.js : 요청마다 구멍만 채워 이어 보냄 ────────
import { resumeToPipeableStream } from 'react-dom/server'

async function handleRequest(req, res) {
  const postponed = loadState('postponed.json')
  const { pipe } = await resumeToPipeableStream(<App />, postponed)
  pipe(res)   // 보류됐던 동적 부분만 렌더되어 정적 셸 위로 스트리밍
}
```

`<App />` 안에서 사용자별 데이터를 쓰는 부분은 `<Suspense>`로 감싸 두고, 그 경계가 build
단계에선 보류(구멍) → request 단계에서 채워진다.

**SSR vs SSG vs PPR API 정리**

| **방식** | **정적 부분** | **동적 부분** | **대표 API** |
| --- | --- | --- | --- |
| 전체 동적 ( SSR ) | - | 요청마다 전부 | renderToPipeableStream / renderToReadableStream |
| 전체 정적 ( SSG ) | 빌드 타임 전부 | - | prerenderToNodeStream / prerender |
| 부분 ( PPR ) | 빌드 타임 (prerender) | 요청 타임 (resume) | prerender + resume\* |

---

## 7. React 19에서 제거된 API

| 제거됨 | 대체 | 왜 제거됐나 |
| --- | --- | --- |
| `renderToNodeStream` | `renderToPipeableStream` | `Readable`만 돌려줘서 전송 시점을 제어할 수 없었고 Suspense를 제대로 지원하지 못했다 |
| `renderToStaticNodeStream` | `prerenderToNodeStream` | 이름과 달리 hydration 마커를 빼주지 않았고 스트림 제어도 불가능했다 |

React 18에서 이미 deprecated 경고가 나왔고 19에서 완전히 사라졌다.

```
// React 18.3.1
Warning: renderToNodeStream is deprecated. Use renderToPipeableStream instead.
Warning: ReactDOMServer.renderToStaticNodeStream() is deprecated. …
```

React 19의 실제 export 목록:

```
react-dom/server : renderToString, renderToStaticMarkup, renderToPipeableStream,
                   renderToReadableStream, resume, resumeToPipeableStream
react-dom/static : prerender, prerenderToNodeStream,
                   resumeAndPrerender, resumeAndPrerenderToNodeStream
```
