---
title: "Redis 자료구조"
repo: "redis/redis"
description: "String, Hash, ZSet이 메모리에서 어떻게 표현되는지 인코딩 관점으로 읽습니다."
date: "2026-06-15"
color: "#7f1d1d"
tags: ["redis", "database"]
---

Redis가 빠른 이유의 절반은 자료구조에 있습니다. 같은 타입이라도 크기에 따라
내부 인코딩을 바꿔 메모리와 속도를 저울질합니다.
