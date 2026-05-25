---
title: "메모리 누수 해결을 위한 여정 - 클라이언트 누수 확인 및 렌더링 로직 개선"
description: "Chat Scroll 로직, Tanstack Query GC 시간, Header 리렌더링, react-slick 누수까지 — 프로덕션에서 발견된 클라이언트 메모리 누수 케이스 정리."
date: "2025-10-27"
tags: ["nextjs", "performance", "memory", "react"]
author: "hovelopin"
series: "메모리 누수 해결을 위한 여정"
seriesOrder: 2
cover: "/covers/memory-leak-2-client-rendering.png"
coverAlt: "메모리 누수 2편 — 클라이언트 렌더링 개선 썸네일"
---

[1편](/posts/memory-leak-1-image-cdn)에서 정적 리소스를 CDN으로 옮겨 서버측 부하를 덜었다면, 이번 편에서는 클라이언트에서 직접 발견된 누수 케이스 네 가지를 정리합니다.

## 1. Chat Scroll 로직 개선

### 문제점 및 원인 분석

Nova 기능 단위 하위에 전역으로 적용되던 `layout.tsx`의 Chat Scroll 로직을 분석한 결과, 메모리 누수의 핵심 원인을 발견했습니다.

```tsx
export default function NovaContentLayout({ children }: Props) {
  const pathname = usePathname();
  const isChatRoute = pathname?.includes("/nova/chat");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const getScrollableElement = (container: HTMLElement): HTMLElement => {
    // 컨테이너 자체가 스크롤 가능하면 우선 사용
    const containerStyle = window.getComputedStyle(container);
    if (
      (containerStyle.overflowY === "auto" ||
        containerStyle.overflowY === "scroll") &&
      container.scrollHeight > container.clientHeight
    ) {
      return container;
    }
    // 명시적 타깃이 있으면 사용
    const byDataAttr = container.querySelector<HTMLElement>(
      "[data-scroll-target]",
    );
    if (byDataAttr) return byDataAttr;
    // overflow 클래스가 지정된 실제 스크롤 영역 우선
    const byOverflowClass = container.querySelector<HTMLElement>(
      ".overflow-y-auto, .overflow-auto",
    );
    if (byOverflowClass) return byOverflowClass;
    // 스타일 기준으로 실제 스크롤 가능한 요소 탐색
    const all = Array.from(container.querySelectorAll<HTMLElement>("*"));
    for (const el of all) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight
      ) {
        return el;
      }
    }
    return container;
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const target = getScrollableElement(container);
    target.scrollTop = target.scrollHeight;
  };

  // 페이지 진입 및 라우팅 변경 시 스크롤 하단 이동
  useEffect(() => {
    if (!isChatRoute) return;
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [pathname, isChatRoute]);

  // 자식 콘텐츠 변경 시 스크롤 하단 이동
  useEffect(() => {
    if (!isChatRoute) return;
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [children, isChatRoute]);

  // DOM 변경(메시지 추가 등) 시 스크롤 하단 이동
  useEffect(() => {
    if (!isChatRoute) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const target = getScrollableElement(container);
    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 0);
      });
    });
    observer.observe(target, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isChatRoute]);

  return <div ref={scrollContainerRef}>{children}</div>;
}
```

### 핵심 문제점

이 코드는 `MutationObserver`로 DOM 변경을 감지하고, 변경마다 `setTimeout`으로 스크롤을 최하단으로 이동시킵니다. 메모리 누수의 원인은 다음 네 가지입니다.

1. Observer 연결 해제와 `setTimeout` 정리가 useEffect cleanup에서만 처리됨
2. `layout.tsx`에 구현되어 있어 Nova 영역을 **완전히 이탈해야만** cleanup 실행
3. Nova 내부 페이지 이동 시에는 cleanup이 실행되지 않음
4. `setTimeout`이 지속적으로 실행되며 `scrollToBottom`을 반복 호출

### 개선

`layout`에서 동작하던 로직을 chat 페이지 내부로 이동하고, 불필요한 `setTimeout`을 제거했습니다. 채팅 이탈 시 cleanup이 정상적으로 실행되어 GC가 수집할 수 있도록 변경했습니다.

```tsx
export default function Conversation() {
  const pathname = usePathname();
  const isChatRoute = pathname.includes("/nova/chat");
  const observerRef = useRef<MutationObserver | null>(null);

  const scrollToBottom = () => {
    if (!isChatRoute) return;
    const target = document.getElementById("nova-scroll-container");
    if (target) {
      target.scrollTop = target.scrollHeight;
    }
  };

  const createObserver = () => {
    const target = document.getElementById("nova-scroll-container");
    if (!target) return null;
    return new MutationObserver(() => {
      scrollToBottom();
    });
  };

  const registerObserver = () => {
    const target = document.getElementById("nova-scroll-container");
    if (!target) return;
    const observer = createObserver();
    if (!observer) return;
    observer.observe(target, { childList: true, subtree: true });
    observerRef.current = observer;
  };

  useEffect(() => {
    registerObserver();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  // ...CHAT UI
}
```

## 2. Tanstack Query GC Time 설정 변경

TanStack Query의 GC는 Garbage Collection을 의미하며, 사용되지 않는 캐시 데이터를 자동으로 제거하는 과정입니다. 캐시는 클라이언트 메모리에 데이터를 보관해 성능을 높이고 불필요한 네트워크 요청을 줄이지만, 오래된 데이터가 쌓이면 그 자체로 메모리 부하가 됩니다.

기존 30분이던 `gcTime`을 default(5분)로 변경해 캐시 정리 주기를 단축했습니다.

**Before**

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1분
      gcTime: 30 * 60 * 1000, // 30분
    },
  },
});
```

**After**

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      // gcTime default 5분
      staleTime: 1 * 60 * 1000,
    },
  },
});
```

## 3. Header 컴포넌트 리렌더링 이슈

Header 컴포넌트가 스크롤할 때마다 두 hook에 의해 함수가 재호출되고 다시 렌더링되고 있었습니다.

1. `useScrollDirection`
   - 스크롤 방향 감지 (up / down)
   - 스크롤 중 여부 (`isScrolling`)
   - 페이지 최상단 여부 (`isAtTop`)
   - 상단 고정 영역(`TOP_LOCK_PX = 50px`) 내 여부 (`isInTopLockArea`)
2. `useHeaderStyle`
   - 헤더의 스타일과 클래스를 동적으로 관리
   - 스크롤 위치에 따라 `at-top` 클래스 토글

![Header 리렌더링 1](/imports/memory-leak-2-client-rendering/image-006.png)

![Header 리렌더링 2](/imports/memory-leak-2-client-rendering/image-001.png)

### 의심되는 로직

```tsx
const handleScrollStop = useCallback(() => {
  if (scrollStopTimeoutRef.current) {
    console.log("clearTimeout!"); // 스크롤 내릴 때마다 호출됨
    clearTimeout(scrollStopTimeoutRef.current);
  }
  scrollStopTimeoutRef.current = setTimeout(() => {
    setIsScrolling(false);
    scrollHistoryRef.current = [];
  }, 150);
}, []);

useEffect(() => {
  // 컴포넌트 마운트 시 초기 스크롤 위치 즉시 확인
  const initialScroll = window.scrollY;
  if (initialScroll <= TOP_LOCK_PX) {
    setScrollDirection("up");
    setIsScrolling(initialScroll > 0);
    setIsAtTop(initialScroll === 0);
    setIsInTopLockArea(true);
  } else {
    setScrollDirection("down");
    setIsScrolling(true);
    setIsAtTop(false);
    setIsInTopLockArea(false);
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", handleScroll);
    if (scrollStopTimeoutRef.current) {
      clearTimeout(scrollStopTimeoutRef.current);
    }
  };
}, [handleScroll]);
```

### 개선: throttle 500ms

상태를 `'top' | 'scroll-down' | 'scroll-up'` 단순 enum으로 정리하고, `throttle`로 핸들러 호출 빈도를 줄였습니다.

```tsx
const Header: React.FC<{ locale: string }> = ({ locale }) => {
  const toggleAllMenu = useAllMenuStore((s) => s.toggle);
  const [scrollState, setScrollState] = useState<
    "top" | "scroll-down" | "scroll-up"
  >("top");
  const lastScrollY = useRef(0);
  const { start } = useProgress();

  const handleScroll = throttle(() => {
    const currentScrollY = window.scrollY;
    if (currentScrollY <= 0) {
      setScrollState("top");
    } else if (currentScrollY > lastScrollY.current) {
      setScrollState("scroll-down");
    } else if (currentScrollY < lastScrollY.current) {
      setScrollState("scroll-up");
    }
    lastScrollY.current = currentScrollY;
  }, 500);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <nav className="inner">
        <a
          href={`/${locale}/`}
          id="po"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            start();
            window.location.href = `/${locale}/`;
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <span>POLARIS OFFICE</span>
        </a>
        <MainMenu />
        <UtilMenu toggleAllMenu={toggleAllMenu} />
      </nav>
      <AllMenu />
      <DownloadPopup />
    </>
  );
};

export default Header;
```

throttle 500ms 적용 후 핸들러 호출과 리렌더링이 눈에 띄게 줄었습니다.

![throttle 효과 1](/imports/memory-leak-2-client-rendering/image-011.png)

![throttle 효과 2](/imports/memory-leak-2-client-rendering/image-014.png)

![throttle 효과 3](/imports/memory-leak-2-client-rendering/image-002.png)

## 4. 라이브러리 메모리 누수 — react-slick

Home 화면에서 `react-slick` 기반 슬라이더 컴포넌트에서 심각한 메모리 누수가 발견됐습니다.

![react-slick 누수 1](/imports/memory-leak-2-client-rendering/image-007.png)

![react-slick 누수 2](/imports/memory-leak-2-client-rendering/image-008.png)

Home에서 아무 동작을 하지 않을 때도 Heap이 계속 증가했고, 세부 지표를 보면 `inner-slider` 인스턴스의 Retained Size가 시간이 지날수록 지속적으로 커졌습니다.

![Heap 증가 1](/imports/memory-leak-2-client-rendering/image-012.png)

![Heap 증가 2](/imports/memory-leak-2-client-rendering/image-009.png)

![Heap 증가 3](/imports/memory-leak-2-client-rendering/image-003.png)

![Heap 증가 4](/imports/memory-leak-2-client-rendering/image-004.png)

분 단위로 Retained Size가 증가했고, 참조하는 인스턴스 수도 함께 늘었습니다. 반면 홈 화면이 아닌 Nova 기능에서는 5분 단위로 측정해도 Heap Size가 일정했습니다.

![Nova 영역 측정](/imports/memory-leak-2-client-rendering/image-010.png)

Timeline 분석에서는 `InnerSlide`가 리렌더링될 때마다 Heap이 튀는 현상이 확인됐습니다.

![InnerSlide 리렌더링 1](/imports/memory-leak-2-client-rendering/image-013.png)

![InnerSlide 리렌더링 2](/imports/memory-leak-2-client-rendering/image-005.png)

이는 라이브러리 자체 이슈로, 관련 GitHub 이슈에서도 동일한 현상이 보고되어 있습니다 — [react-slick #1257](https://github.com/akiran/react-slick/issues/1257). 자체 코드로는 회피가 불가능하다고 판단해, 슬라이더 자체를 다른 솔루션으로 교체하는 작업은 별도 트랙으로 분리해 진행했습니다.

## 마치며

여기까지가 클라이언트에서 잡아낸 누수 후보들입니다. Chat scroll의 observer 정리, TanStack Query GC 주기 단축, Header 리렌더링 throttle, 그리고 react-slick 교체까지 적용한 뒤 클라이언트 측 Heap은 안정화됐습니다.

하지만 운영 환경의 서버 메모리는 여전히 우상향을 그리고 있었습니다. 클라이언트에서 끊을 수 있는 누수는 다 끊었는데 서버 RSS가 계속 늘어난다면, 원인은 다른 층에 있다는 뜻입니다. [3편 — 서버사이드 편](/posts/memory-leak-3-server-side)에서는 운영과 똑같은 OOM을 재현할 수 있는 부하 테스트 환경을 만들고, 그 안에서 진짜 원인 한 점을 좁혀 가는 과정을 다룹니다.
