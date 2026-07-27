---
title: "Hydrate"
---

![SSR 렌더링 흐름](/images/research/ssr/01-hydrate.png)

앞 장에서 살펴봤듯 Hydration은 JS 번들을 전달받아 기존 HTML을 상호작용 가능한
상태로 만드는 과정이다.
그럼 앞서 만든 HTML을 React에서는 어떤 API로 hydration하는지 알아보자.

## 1. hydrateRoot

```jsx
import { hydrateRoot } from 'react-dom/client'

hydrateRoot(domNode, reactNode, options?)
```

hydrateRoot는 서버가 미리 그려 보낸 HTML 마크업 위에 React를 얹어 살려내는(hydration)
클라이언트 측 API다. (<https://ko.react.dev/reference/react-dom/client/hydrateRoot>)

`react-dom/server`의 `render*` → JSX → HTML 문자열 생성 (서버)
`react-dom/client`의 `hydrateRoot` → HTML을 상호작용 가능하게 함 (클라이언트)

**왜 필요한가?**

React SSR API를 볼 때 나왔듯 서버가 보낸 HTML은 이벤트 핸들러 등이 붙지 않은 뼈대다.
hydrateRoot는 이 정적 마크업 위에 React 트리를 다시 연결하고 이벤트·상태 같은 동작을
붙인다. 그래야 화면이 상호 작용 가능한 상태가 된다.

**특징**

<!-- TODO: 이미지 — createRoot / hydrateRoot 비교 (Confluence "[Concept] Hydrate") -->

CSR에서 제공하는 createRoot(<https://ko.react.dev/reference/react-dom/client/createRoot>)와는
다르다. 둘 다 React를 DOM에 붙이지만 전제가 갈린다.

|  | **createRoot** | **hydrateRoot** |
| --- | --- | --- |
| 대상 DOM | 빈 컨테이너 | 서버 HTML이 이미 채워진 컨테이너 |
| 하는 일 | 처음부터 새로 그림 | 기존 마크업을 재사용하고 이벤트만 연결 |
| 용도 | CSR | SSR의 클라이언트 측 마무리 |

즉 SSR에서는 createRoot가 아니라 hydrateRoot를 써야 서버가 그린 HTML을 버리지 않고
재활용한다.

> ‼️ **정리** : 클라이언트에서 React가 컴포넌트를 실행해 Fiber 트리를 만들어간다.
> 이때 만드는 건 첫 번째 렌더 결과고 `useEffect`는 아직 실행되기 전이다. 노드를
> 하나 확정할 때마다 서버가 보낸 실제 DOM에서 커서가 가리키는 위치의 노드를 꺼내
> 태그와 텍스트가 맞는지 대조한다. 일치하면 그 DOM 노드를 재사용해 Fiber에 연결하고,
> 어긋나면 그 지점이 속한 가장 가까운 Suspense 경계를 버리고 클라이언트에서 새로
> 렌더한다.
>
> 트리 전체를 붙이고 나면 커밋 단계에서 연결이 확정되고, 그다음에야 `useEffect`가
> 실행된다. effect가 상태를 바꿔 화면이 갱신되는 건 hydration이 끝난 뒤의 일반적인
> 업데이트라 mismatch와 무관하다. 그래서 지켜야 할 조건은 하나다. 첫 렌더의 결과가
> 서버와 같기만 하면 된다.
