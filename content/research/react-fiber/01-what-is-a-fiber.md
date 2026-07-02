---
title: "Fiber 노드란 무엇인가"
---

## 한 컴포넌트 = 하나의 작업 단위

Fiber는 결국 자바스크립트 객체 하나입니다. 컴포넌트 인스턴스이자,
"이번에 해야 할 일"을 표현하는 작업 단위이기도 합니다.

```js
function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.stateNode = null; // 실제 DOM 또는 클래스 인스턴스
  this.child = null;
  this.sibling = null;
  this.return = null; // 부모
}
```

`child`, `sibling`, `return` 세 포인터가 트리를 이루면서도
연결 리스트처럼 순회할 수 있게 해줍니다. 이 구조 덕분에 재귀 대신
반복문으로 순회할 수 있고, 중간에 멈췄다가 이어서 할 수 있습니다.

## 왜 트리를 두 개 두는가

`current`와 `workInProgress` 두 트리를 번갈아 쓰는 더블 버퍼링으로,
화면에 보이는 트리를 건드리지 않고 다음 화면을 조립합니다.
