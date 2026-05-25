---
title: "Claude와 Figma로 구현하는 워크플로우의 혁신 (MCP)"
description: "Figma-MCP 프로토콜로 Figma 디자인을 Claude/Cursor/Windsurf에 연결해 코드로 자동 변환하는 셋업 가이드."
date: "2025-03-28"
tags: ["ai", "claude", "figma", "mcp"]
author: "hovelopin"
cover: "/covers/claude-figma-mcp.png"
coverAlt: "Claude와 Figma MCP 연동 썸네일"
---

Figma-MCP 프로토콜을 활용해 Figma의 디자인 요소를 Claude, Cursor, Windsurf 같은 AI 도구로 자동화합니다. 기본 동작은 Figma-MCP 서버를 띄우고 AI 도구와 연결한 뒤, 피그마 링크를 입력하면 디자인을 분석해 코드로 변환된 결과를 받는 흐름입니다.

## 1. Figma API 토큰 발급

피그마에 접속해 자신의 프로필을 클릭하면 Settings에 진입할 수 있습니다.

![Figma Settings 진입](/imports/claude-figma-mcp/image-002.png)

`Security → Generate new token`으로 API 키를 발급합니다.

![API 토큰 발급](/imports/claude-figma-mcp/image-008.png)

## 2. Figma-MCP 서버 설치

MCP 프로토콜 연결이 가능한 AI 도구(Claude, Cursor, Windsurf 등)가 필요합니다. 이 글에서는 Claude를 기준으로 진행합니다.

먼저 Figma-MCP 서버를 설치합니다. 서버는 [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP) 레포지토리를 클론해서 실행합니다.

```bash
git clone https://github.com/GLips/Figma-Context-MCP.git
```

의존성을 설치합니다.

```bash
pnpm install
```

`.env.sample` 파일에서 `FIGMA_API_KEY`에 1단계에서 발급받은 토큰을 입력합니다.

```dotenv
# Your Figma API access token
# Get it from your Figma account settings: https://www.figma.com/developers/api#access-tokens
FIGMA_API_KEY=<발급받은 API KEY>

# Server configuration
PORT=3333
```

파일명을 `.env.sample`에서 `.env`로 변경한 뒤 서버를 실행합니다.

```bash
pnpm run dev
```

서버가 정상적으로 떠 있다면 콘솔에서 다음과 같은 로그를 확인할 수 있습니다.

![서버 실행 로그](/imports/claude-figma-mcp/image-003.png)

## 3. Claude Desktop과 연결

Figma-MCP를 Claude와 함께 쓰려면 Desktop 버전이 필요합니다. [Claude Desktop Download](https://claude.ai/download)에서 OS에 맞는 버전을 받습니다.

설치 후 실행해 설정 탭에 접속합니다.

![Claude 설정 진입](/imports/claude-figma-mcp/image-006.png)

좌측 탭의 `개발자(Developer)`를 선택하고 설정 편집을 엽니다.

![개발자 탭](/imports/claude-figma-mcp/image-011.png)

`claude_desktop_config.json` 파일을 클릭합니다.

![config 파일 열기](/imports/claude-figma-mcp/image-014.png)

아래 설정을 구성 파일에 추가합니다.

> ⚠️ Claude를 설정했을 때 셋팅이 됐다 안 됐다 하는 문제가 발생하는 경우가 있습니다. 두 가지 설정을 모두 시도해 볼 수 있습니다.

**설정 A — figma-mcp**

```json
{
  "mcpServers": {
    "figma-mcp": {
      "command": "npx",
      "args": ["figma-mcp"],
      "env": {
        "FIGMA_API_KEY": "<발급받은 API KEY>"
      }
    }
  }
}
```

**설정 B — figma-developer-mcp**

```json
{
  "mcpServers": {
    "figma-developer-mcp": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "<발급받은 API KEY>"
      }
    }
  }
}
```

설정이 완료되면 피그마에서 `Copy link to selection`으로 링크를 복사한 뒤, Claude에 링크와 함께 원하는 스타일링 도구(예: `styled-components`)와 프레임워크/라이브러리를 함께 전달합니다.

![Figma 링크 복사](/imports/claude-figma-mcp/image-001.png)

Claude는 해당 링크를 분석해 다음과 같이 코드로 변환된 결과를 돌려줍니다.

![변환 결과 — 메인](/imports/claude-figma-mcp/image-005.png)

| 피그마 예시 | 변환 디자인 |
|---|---|
| ![변환 결과 — 코드 1](/imports/claude-figma-mcp/image-012.png) | ![변환 결과 — 미리보기 1](/imports/claude-figma-mcp/image-007.png) |
<!-- | ![변환 결과 — 코드 2](/imports/claude-figma-mcp/image-013.png) | ![변환 결과 — 미리보기 2](/imports/claude-figma-mcp/image-010.png) |
| ![변환 결과 — 코드 3](/imports/claude-figma-mcp/image-009.png) | ![변환 결과 — 미리보기 3](/imports/claude-figma-mcp/image-004.png) | -->

## 마치며

생성된 결과물의 완성도가 꽤 높았습니다. 정의된 아이콘과 세부 CSS만 추가하면, UI 로직에 들이는 비용을 줄이고 핵심 비즈니스 로직에 더 집중할 수 있을 것 같습니다.

특히 Cursor처럼 IDE에 직접 연결되는 AI 도구를 쓰면 진행 중인 프로젝트 구조를 함께 이해하기 때문에 활용도가 더 높을 것으로 보입니다.
