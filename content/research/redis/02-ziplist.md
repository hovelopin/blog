---
title: "ziplist 와 인코딩 전환"
---

## 작을 땐 촘촘하게

원소가 적으면 Redis는 ziplist(또는 listpack)라는 연속 메모리 블록에 담습니다.
포인터 오버헤드가 없어 캐시 친화적입니다. 임계값을 넘으면 hashtable/skiplist로 승격합니다.
