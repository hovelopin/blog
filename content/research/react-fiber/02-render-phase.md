---
title: "렌더 단계: 중단 가능한 순회"
---

## beginWork 와 completeWork

렌더 단계는 `workLoop`가 `performUnitOfWork`를 반복 호출하며 진행됩니다.
내려가면서 `beginWork`, 리프에 닿으면 올라오면서 `completeWork`를 부릅니다.

```js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

핵심은 `shouldYield()`입니다. 브라우저가 더 급한 일(입력 등)을 처리해야 하면
루프를 양보하고, 나중에 이어서 돕니다. 이것이 "중단 가능한 렌더링"입니다.
