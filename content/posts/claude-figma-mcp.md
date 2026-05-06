---
title: "Claude와 Figma로 구현하는 워크플로우의 혁신 (MCP)"
description: ""
date: "2025-03-28"
tags: []
author: "hovelopin"
---

Figma-MCP 프로토콜을 활용해 Figma에 있는 디자인 요소를 Claude, Cursor, Windsurf와 같은 AI 도구로 자동화하고자 합니다. 기본 동작 방식은 Figma-MCP 서버를 설정하고 이를 AI 도구와 통합하여 피그마 링크를 기반으로 디자인을 분석한 후, 코드로 변환된 결과물을 받는 것입니다.

## 1️⃣ Figma API 토큰 받기

1.  피그마 계정에 접속해서 아래와 같이 자신의 프로필을 클릭하면 Settings 값에 접근할 수 있습니다.

![image-20250327-145353.png](/imports/claude-figma-mcp/image-002.png)

2.  아래와 같이 Security → Generate new token을 클릭해서 API_KEY를 발급받습니다.

![image-20250327-145638.png](/imports/claude-figma-mcp/image-008.png)

## 2️⃣ Figma-MCP 프로토콜 연결하기

일단 기본적으로 MCP 프로토콜 연결이 가능한 `Claude, Cursor, Windsurf`와 같은 AI 도구가 필요합니다. 저는 Claude 유료 계정을 보유하고 있어 아래 가이드는 Claude를 기반으로 작성하겠습니다.

먼저 Figma-MCP 서버 설치가 필요합니다.

1.  해당 서버 설치는 [Github 레포지토리](https://github.com/GLips/Figma-Context-MCP)를 Clone 받은 후 실행하시면 됩니다.

```
git clone https://github.com/GLips/Figma-Context-MCP.git
```

2.  해당 레포지토리를 클론 받았으면 node_modules를 설치해줍니다.

```
pnpm install
```

3.  설치가 완료되면 .env.sample 파일에 들어가서 `FIGMA_API_KEY` 를 입력해야 합니다. 1번 과정에서 발급 받은 API KEY를 등록해줍니다.

```
# Your Figma API access token
# Get it from your Figma account settings: https://www.figma.com/developers/api#access-tokens
FIGMA_API_KEY=<발급받은 API KEY>

# Server configuration
PORT=3333
```

4.  완료가 되면 `.env.sample` 파일의 이름을 `.env`로 변경한 뒤 서버를 실행시킵니다.

```
pnpm run dev
```

5.  서버가 정상적으로 실행되면 아래와 같은 결과값을 콘솔에서 확인할 수 있습니다.

![image-20250327-150231.png](/imports/claude-figma-mcp/image-003.png)

## 3️⃣ Claude와 연결하기

Claude를 Figma-MCP와 함께 사용하기 위해서는 Desktop 버전이 필요합니다. 따라서 아래 링크에 접속하여 사용 중인 OS에 맞는 버전을 다운로드해야 합니다. ( [Claude Desktop Download Link](https://claude.ai/download) )

1.  다운로드가 완료됐다면 실행 후 아래와 같이 설정 탭에 접속합니다.

![image-20250327-151108.png](/imports/claude-figma-mcp/image-006.png)

2.  설정 탭에 들어갔다면 좌측 탭에 개발자(Developer)를 선택 후 설정 편집에 들어갑니다.

![image-20250327-151226.png](/imports/claude-figma-mcp/image-011.png)

3.  설정 편집을 누르면 아래와 같이 `claude_desktop_config.json` 파일을 클릭합니다.

![image-20250327-151335.png](/imports/claude-figma-mcp/image-014.png)

4.  아래 설정된 json을 복사하여 구성 파일에 추가합니다.

> ❗Claude를 설정했을때 아래 설정 셋팅이 됐다 안됐다가 하는 문제가 현재 발생하고 있습니다. ❗

```
{
    "mcpServers": {
        "figma-mcp": {
          "command": "npx",
          "args": ["figma-mcp"],
          "env": {
            "FIGMA_API_KEY": "<발급 받은 API KEY>"
          }
        }
      }
}
```

```
{
  "mcpServers": {
    "figma-developer-mcp": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "<발급 받은 API KEY>"
      }
    }
  }
}
```

5.  위와 같이 설정이 완료된 후 피그마에서 아래와 같이 Copy link to selection을 통해 전달받은 링크를 Claude에 전달하여 원하는 스타일링 도구 ( ex. styled-component )와 프레임워크/라이브러리를 전달합니다.

![image-20250327-153505.png](/imports/claude-figma-mcp/image-001.png)

6.  해당 링크를 기반으로 Claude에게 질문하면 Claude는 코드로 변경하고 아래와 같은 결과를 가져옵니다.

![image-20250328-043345.png](/imports/claude-figma-mcp/image-005.png)

![image-20250327-153835.png](/imports/claude-figma-mcp/image-012.png)![image-20250328-004133.png](/imports/claude-figma-mcp/image-013.png)![image-20250328-004656.png](/imports/claude-figma-mcp/image-009.png)

![image-20250327-153919.png](/imports/claude-figma-mcp/image-007.png)![image-20250328-004113.png](/imports/claude-figma-mcp/image-010.png)![image-20250328-004850.png](/imports/claude-figma-mcp/image-004.png)

위와 같은 결과물로 보았을 때 꽤나 완성도 있는 코드가 적용되었고, 정의되어 있는 아이콘 및 세부적인 CSS만 추가하면 UI 로직에 투자하는 비용을 줄이고 핵심 비즈니스 로직에 더 집중할 수 있을 것 같습니다.

개인적으로 Cursor와 같은 IDE와 연결된 AI 도구를 활용하면 현재 내가 진행하고 있는 프로젝트 구조도 이해하고 활용도도 높을것으로 예상됩니다.

감사합니다. 😀
