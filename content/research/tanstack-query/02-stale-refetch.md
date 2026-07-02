---
title: "stale 과 백그라운드 refetch"
---

## 오래됐으면 조용히 새로고침

캐시된 값은 즉시 보여주되(stale-while-revalidate), 백그라운드에서
다시 받아 최신으로 교체합니다. 사용자는 기다리지 않습니다.
