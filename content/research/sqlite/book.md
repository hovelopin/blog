---
title: "SQLite 내부"
repo: "sqlite/sqlite"
description: "파일 하나에 담긴 데이터베이스. B-tree와 페이저 계층을 읽습니다."
date: "2026-05-30"
tags: ["sqlite", "database"]
---

세상에서 가장 많이 배포된 DB. 서버가 없고, 그냥 파일 하나입니다.
그 파일 안이 어떻게 생겼는지 페이지 단위로 들여다봅니다.
