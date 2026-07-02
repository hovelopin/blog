---
title: "스케줄러와 우선순위"
---

## lane 모델

React는 우선순위를 비트마스크(lane)로 표현합니다. 동기 lane, 기본 lane,
트랜지션 lane 등이 있고, 급한 업데이트가 덜 급한 업데이트를 앞지를 수 있습니다.

```js
const SyncLane = 0b0001;
const InputContinuousLane = 0b0100;
const DefaultLane = 0b10000;
```
