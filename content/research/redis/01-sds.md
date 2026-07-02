---
title: "SDS: Redis의 문자열"
---

## 왜 C 문자열을 안 쓰는가

Redis는 널 종료 문자열 대신 SDS(Simple Dynamic String)를 씁니다.
길이를 O(1)로 알 수 있고, 이진 안전(binary-safe)합니다.

```c
struct sdshdr {
    int len;
    int free;
    char buf[];
};
```
