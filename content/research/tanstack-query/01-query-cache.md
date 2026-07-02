---
title: "QueryCache: 키로 찾는 캐시"
---

## queryKey 가 곧 주소

모든 쿼리는 직렬화된 `queryKey`로 캐시에 저장됩니다.
같은 키를 쓰는 컴포넌트끼리 결과를 공유합니다.
