---
title: "Streaming SSR"
---

앞선 글에서 SSR을 살펴봤다. SSR은 서버에서 완성된 HTML을 내려주고 브라우저에서
Hydration을 거쳐 상호작용이 가능한 페이지를 만든다. 덕분에 CSR에서 문제가 됐던 빈
화면(Blank Page)을 보지 않아도 되고, 디바이스 사양이 낮을수록 첫 화면이 늦게 뜨는
문제도 완화된다.

다만 React가 제공하는 SSR API(`renderToString`)는 기본이 동기 방식이다. 화면에
필요한 데이터를 모두 가져온 뒤에야 HTML을 만들 수 있다. API 응답이 느려지면 HTML이
만들어지는 시점도 그만큼 밀린다. 결국 사용자는 상호작용이 불가능한 페이지조차 한참
뒤에야 보게 된다.

이런 문제가 생기는 이유는 각 단계가 Concurrent하게 진행되지 못하고 순차적으로 묶여
있기 때문이다.

- 서버에서 데이터를 **모두** 가져와야 HTML을 렌더링할 수 있고
- 클라이언트에 자바스크립트 번들이 **모두** 로드돼야 Hydration을 시작할 수 있고
- Hydration이 **모두** 끝나야 컴포넌트가 상호작용 가능한 상태가 된다

앞 단계가 끝나기 전까지 뒤 단계는 아무것도 시작할 수 없는, 전형적인 워터폴
구조다. React는 이 문제를 풀려고 Suspense를 활용한 `Streaming Architecture`를
도입했다.

## Streaming Architecture가 해결하는 두 가지

Streaming Architecture는 앞서 이야기한 워터폴을 두 지점에서 끊어낸다.

### 1. 서버에서 HTML을 스트리밍으로 내려보낸다

`renderToString`은 트리 전체를 하나의 문자열로 만들어 반환한다. 문자열이 완성돼야
응답을 시작할 수 있으니, 트리 안에 느린 데이터가 하나만 끼어 있어도 전체 HTML이
그만큼 지연된다.

React 18의 `renderToPipeableStream`(Node.js) / `renderToReadableStream`(Web
Streams)은 HTML을 **청크 단위로 흘려보낸다.** 그 분할 기준이 `<Suspense>`다.

```jsx
<Layout>
  <Header />
  <Suspense fallback={<PostSkeleton />}>
    <Post />  {/* 느린 데이터 */}
  </Suspense>
  <Footer />
</Layout>
```

서버는 `<Post />`의 데이터를 기다리지 않고 준비된 부분부터 먼저 내보낸다.

![SSR 렌더링 흐름](/images/research/ssr/01-streaming-ssr.png)

이후 Post가 준비되면 리액트는 동일한 Stream에 HTML을 추가로 흘려보낸다. 이때 그
HTML을 올바른 "위치"에 주입할 작은 inline "script" 태그도 함께 보낸다.

![SSR 렌더링 흐름](/images/research/ssr/02-streaming-ssr.png)

### 2. 완성된 HTML을 선택적으로 Hydration한다

HTML이 빨리 도착해도 Hydration이 진행되지 않으면 상호작용 시점은 개선되지 않는다.
그래서 React는 Post에 해당하는 JS 코드가 로드되지 않아도, 해당 코드를 제외한
나머지를 Hydration 한다.

![SSR 렌더링 흐름](/images/research/ssr/03-streaming-ssr.png)

## Streaming Architecture의 또 다른 이점

![SSR 렌더링 흐름](/images/research/ssr/04-streaming-ssr.png)

Hydration이 진행되는 도중에 **이미 Hydration이 끝난 컴포넌트**에서 클릭 같은
이벤트가 발생했다고 해보자. 기존 방식이라면 Hydration이 메인 스레드를 붙잡고 있었기
때문에 이벤트는 그 작업이 전부 끝날 때까지 대기해야 했다.

하지만 Streaming Architecture에서 Hydration은 중단 가능한 작업이다. React는 진행
중이던 Hydration을 잠시 멈추고 우선순위가 높은 클릭 이벤트를 먼저 처리한 뒤 하던
일을 이어간다. 덕분에 페이지 전체의 Hydration이 끝나지 않았더라도 사용자는 이미
준비된 영역에서 곧바로 상호작용하고 페이지를 이동할 수 있다.

### 참고
- https://github.com/reactwg/react-18/discussions/37