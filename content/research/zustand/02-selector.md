---
title: "셀렉터와 useSyncExternalStore"
---

## 필요한 조각만 구독

컴포넌트는 셀렉터로 스토어의 일부만 고릅니다. 선택된 값이 바뀔 때만
리렌더가 일어나도록 `useSyncExternalStore`가 조율합니다.
