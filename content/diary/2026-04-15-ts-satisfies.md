---
date: "2026-04-15"
mood: "satisfied"
---

`satisfies` 연산자 진짜 좋다. `as const` + `satisfies Record<string, Config>` 조합으로 키 리터럴 타입은 그대로 유지하면서 값만 검증할 수 있음. 이제 `as`를 쓰던 자리의 80%가 `satisfies`로 대체됨.
