---
title: "Cursor로 모든 웹페이지를 Figma로 변환하기"
description: "Grab의 Cursor Talk To Figma MCP로 임의의 웹페이지를 Figma 디자인으로 자동 변환하고, 디자이너 없는 팀에서 활용해 본 기록."
date: "2025-11-17"
tags: ["ai", "mcp", "cursor", "figma", "design"]
author: "hovelopin"
cover: "/covers/cursor-webpage-to-figma.jpg"
coverAlt: "Cursor로 웹페이지를 Figma로 변환하기 썸네일"
---

이번 글에서는 Cursor를 활용해 원하는 웹페이지를 Figma 디자인으로 옮기고 입맛에 맞게 커스터마이징하는 방법을 정리합니다. Grab에서 만든 [Cursor Talk To Figma MCP](https://github.com/grab/cursor-talk-to-figma-mcp)를 사용합니다.

## 1. MCP & 프로젝트 셋업

먼저 로컬 환경에서 프로젝트를 클론합니다.

```bash
git clone https://github.com/grab/cursor-talk-to-figma-mcp.git
cd cursor-talk-to-figma-mcp
```

### Bun 설치

MCP 서버 구동에 Bun 런타임이 필요합니다. OS에 맞는 명령어로 설치합니다.

**Windows**

```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS / Linux**

```bash
curl -fsSL https://bun.sh/install | bash
```

### MCP 셋업

```bash
bun setup
```

이 명령은 다음을 자동으로 처리합니다.

1. `.cursor` 디렉토리 생성
2. 의존성 설치
3. `mcp.json` 설정 파일 생성

셋업이 끝나면 Cursor의 `Settings → MCP Servers`에서 연결된 서버를 확인할 수 있습니다.

![Cursor MCP Servers 확인](/imports/cursor-webpage-to-figma/image-007.png)

### 서버 실행

```bash
bun socket
```

![Bun socket 실행](/imports/cursor-webpage-to-figma/image-004.png)

## 2. Figma 플러그인 연동

TalkToFigma MCP를 쓰려면 Figma 플러그인과 연동이 필요합니다. 순서대로 진행합니다.

하단 액션 탭을 클릭한 뒤 `Import from manifest`를 선택합니다.

![Import from manifest](/imports/cursor-webpage-to-figma/image-008.png)

위에서 클론받은 프로젝트의 `src/cursor_mcp_plugin/manifest.json`을 선택합니다.

![manifest.json 선택](/imports/cursor-webpage-to-figma/image-005.png)

플러그인을 실행합니다.

![플러그인 실행](/imports/cursor-webpage-to-figma/image-009.png)

`Connect` 버튼을 눌러 로컬에서 실행 중인 MCP 서버와 연결합니다.

![Connect 버튼](/imports/cursor-webpage-to-figma/image-001.png)

![연결 상태 확인](/imports/cursor-webpage-to-figma/image-003.png)

연결이 정상적으로 됐다면 **터미널에 표시된 Channel ID**와 **Figma 플러그인에 표시된 Channel ID**가 같습니다. 두 값이 일치하면 MCP 서버와 Figma 플러그인이 연결된 상태입니다.

## 3. 웹페이지를 Figma 디자인으로

이제 Playwright MCP로 디자인을 분석하고, TalkToFigma MCP로 Figma에 옮기는 작업을 진행합니다.

> https://lovable.dev/ 디자인을 Playwright MCP로 참고해서 TalkToFigma MCP를 활용해서 Figma에 디자인해줘

**AI 결과**

![AI 결과 1](/imports/cursor-webpage-to-figma/image-002.png)

![AI 결과 2](/imports/cursor-webpage-to-figma/image-010.png)

**원본 사이트**

![Demo Site](/imports/cursor-webpage-to-figma/image-006.png)

## 4. 느낀점

변환된 결과물이 원본과 완전히 일치하지는 않습니다. 하지만 **디자이너가 없는 팀 환경**에서는 충분히 실용적입니다.

### 활용 시나리오

디자인 리소스가 부족한 상황에서는 다음과 같은 흐름으로 쓸 수 있습니다.

1. **레퍼런스 수집** — 참고할 웹사이트 스크린샷 캡처
2. **Figma 초안 생성** — TalkToFigma MCP로 빠르게 디자인 초안
3. **기획 및 수정** — Figma에서 팀 요구사항에 맞게 다듬기
4. **개발 진행** — 완성된 디자인 기반으로 구현

특히 **빠른 프로토타이핑**이나 **PoC** 단계에서 디자인 시안이 필요할 때, 디자이너를 기다리지 않고 즉시 작업에 들어갈 수 있다는 점이 가장 큰 장점입니다. 완벽한 디자인 복제보다는 **빠른 기획·커뮤니케이션 도구**로 접근하면 팀 생산성을 끌어올릴 수 있습니다.
