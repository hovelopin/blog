---
title: "createStore: 바닐라 코어"
---

## 클로저 하나면 충분하다

Zustand의 코어는 React와 무관한 순수 자바스크립트 스토어입니다.

```js
const createStore = (createState) => {
  let state;
  const listeners = new Set();
  const setState = (partial) => {
    state = { ...state, ...partial };
    listeners.forEach((l) => l());
  };
  const getState = () => state;
  const subscribe = (l) => (listeners.add(l), () => listeners.delete(l));
  state = createState(setState, getState);
  return { setState, getState, subscribe };
};
```
