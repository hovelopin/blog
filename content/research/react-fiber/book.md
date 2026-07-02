---
title: "React Fiber"
repo: "facebook/react"
description: "React가 렌더링을 어떻게 중단하고 재개하는지, Fiber 아키텍처를 코드로 따라 읽습니다."
date: "2026-06-28"
tags: ["react", "renderer"]
---

React 18의 동시성(concurrency)은 대부분 **Fiber 재조정기(reconciler)** 위에 얹혀 있습니다.
이 책에서는 `packages/react-reconciler`를 중심으로, 렌더 단계가 어떻게 쪼개지고
커밋 단계에서 어떻게 DOM에 반영되는지를 챕터별로 따라갑니다.
