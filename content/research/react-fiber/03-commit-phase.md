---
title: "커밋 단계: 한 번에 반영하기"
---

## 커밋은 동기적이다

렌더 단계는 쪼개지지만, 커밋 단계는 중간에 멈추지 않습니다.
사용자가 찢어진 화면을 보지 않도록, effect 리스트를 훑으며 DOM 변경을 한 번에 적용합니다.

- before mutation
- mutation (실제 DOM 삽입/삭제/갱신)
- layout (`useLayoutEffect` 등)
