---
title: "Playwright MCP와 Shadcn을 활용한 AI 기반 디자인 시스템 구축하기"
description: "임의의 웹사이트를 Playwright MCP로 분석해 디자인 시스템 명세를 뽑고, Shadcn MCP로 컴포넌트와 페이지까지 자동 구성한 실험."
date: "2025-11-14"
tags: ["ai", "mcp", "shadcn", "playwright", "design-system"]
author: "hovelopin"
---

웹 개발을 하다 보면 마음에 드는 사이트의 디자인을 참고하고 싶을 때가 있다. 이 글에서는 **Playwright MCP**로 특정 웹사이트의 시각 구조를 분석하고, 그 결과를 **Shadcn MCP**에 넘겨 재사용 가능한 컴포넌트와 페이지까지 한 번에 만들어 보는 실험을 정리한다.

## 1. Playwright MCP 셋팅

Playwright는 웹 페이지를 자동화·분석할 수 있는 도구다. MCP 버전은 Microsoft 공식 패키지가 있지만 설정 과정에서 문제가 있어, 동일한 기능을 제공하는 [`executeautomation/mcp-playwright`](https://github.com/executeautomation/mcp-playwright)를 대신 사용했다.

Cursor의 MCP Tools Setting에 다음을 추가한다.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

## 2. Playwright로 페이지 분석

설정이 끝나면 Playwright로 임의의 웹사이트를 시각적으로 분석할 수 있다. 이번에는 [lovable.dev](https://lovable.dev/)를 대상으로, 디자인 시스템과 스타일 가이드를 한 문서로 뽑아내도록 요청했다.

> Playwright MCP를 이용해 https://lovable.dev/ 의 UI/UX를 따라할 수 있도록 디자인 시스템과 스타일 가이드라인을 만들고 싶어. xml 형태로 하나의 문서를 만들어줘.

요청을 보내면 Cursor가 Playwright 도구를 호출해 페이지에 직접 접속하고, 시각적 분석 결과를 XML 형식의 명세 파일로 정리해 준다.

![lovable.dev 분석 결과 XML](/imports/playwright-mcp-shadcn-design-system/image-005.png)

### XML을 쓴 이유

AI 모델은 자유 형식 텍스트보다 **태그로 명시적으로 구조화된 입력**을 더 잘 이해한다. 그래서 디자인 시스템 명세처럼 컴포넌트·색상·타이포·간격이 위계로 묶이는 데이터는 XML로 두는 편이 후속 단계에서 더 일관된 결과를 만든다.

## 3. Shadcn MCP로 컴포넌트 구축

추출한 XML을 Shadcn MCP에 넘겨 디자인 시스템 컴포넌트를 만든다.

> @lovable-design-system.xml 이 디자인 시스템을 기반으로 `/ui-components` 페이지를 만들어줘.
>
> - 이 페이지에서는 디자인 시스템에 표현된 모든 컴포넌트를 한눈에 확인할 수 있어야 해.
> - 이 컴포넌트들을 이용해서 다른 페이지들의 UI/UX를 구현할 거니까 잘 모듈화해줘.
> - Shadcn MCP로 만들 거고, 나만의 테마를 만들고 싶으니 `globals.css`를 적절히 수정/추가하면서 구현해줘.

명령을 받으면 Playwright로 분석한 페이지 정보를 바탕으로 필요한 컴포넌트 목록을 추리고, Shadcn MCP가 실제 코드를 생성한다.

![Shadcn MCP가 컴포넌트 생성하는 모습](/imports/playwright-mcp-shadcn-design-system/image-006.png)

구성이 끝나면 `/ui-components` 페이지에 컴포넌트들이 한 화면에 모인다.

![UI Components — 갤러리 1](/imports/playwright-mcp-shadcn-design-system/image-004.png)

![UI Components — 갤러리 2](/imports/playwright-mcp-shadcn-design-system/image-012.png)

![UI Components — 갤러리 3](/imports/playwright-mcp-shadcn-design-system/image-011.png)

![UI Components — 갤러리 4](/imports/playwright-mcp-shadcn-design-system/image-009.png)

원본과 비슷한 부분도 있지만, 그대로 가져다 쓸 수 있을 만큼 완성도 있는 디자인 시스템이 뽑히지는 않았다.

추가로 Chart 컴포넌트도 요청했는데, 다양한 차트 변형을 한 번에 생성해 줬다.

![Chart 컴포넌트 생성 결과](/imports/playwright-mcp-shadcn-design-system/image-002.png)

## 4. 페이지 조립

만들어진 컴포넌트들을 가지고 처음 분석했던 페이지를 참고해 한 페이지를 조립해 봤다.

> 현재 만든 컴포넌트들의 조합으로 Playwright MCP를 활용해서 https://lovable.dev/ 페이지를 동일하게 구성해줘. `/lovable` 페이지로 만들면 돼.

**AI 결과**

![AI 결과 — 상단](/imports/playwright-mcp-shadcn-design-system/image-007.png)

**Demo Site (원본)**

![Demo Site — 상단](/imports/playwright-mcp-shadcn-design-system/image-008.png)

**AI 결과**

![AI 결과 — 하단](/imports/playwright-mcp-shadcn-design-system/image-010.png)

**Demo Site (원본)**

![Demo Site — 하단](/imports/playwright-mcp-shadcn-design-system/image-003.png)

## 5. 느낀점

개별 컴포넌트만 보면 원본과 차이가 있지만, 전체 페이지 레이아웃은 상당히 유사하게 구현됐다. 특히 다음이 인상적이었다.

1. **레이아웃 구성** — 섹션 배치와 전체 구조가 원본과 비슷하게 잡힌다.
2. **반응형 디자인** — 모바일·태블릿·데스크톱 각 화면 크기에서 자연스럽게 동작한다.
3. **시각적 계층** — 제목, 본문, CTA 버튼 등의 우선순위가 명확하게 표현된다.

다만 컴포넌트 단위 디테일(여백·라인·미세한 인터랙션)은 사람이 다듬어야 하는 영역으로 남았다. **레이아웃 골조까지는 AI 도구가 빠르게 메워주고, 디테일은 사람이 채운다** — 디자인 시스템을 처음부터 짜기 전에 한 번쯤 시도해 볼 만한 워크플로우다.

## 참고

- [executeautomation/mcp-playwright](https://github.com/executeautomation/mcp-playwright)
- [Shadcn MCP 문서](https://ui.shadcn.com/docs/mcp)
