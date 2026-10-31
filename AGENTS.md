# 개인 블로그 (hojin-blog)

## What This Is
런타임 마이크로프론트엔드로 구성한 개인 블로그. 글은 `content/` 아래 마크다운으로 관리하고, 빌드 시 정적 페이지로 프리렌더한다.
- `content/posts/` — 기술 블로그 글
- `content/research/` — 시리즈 단위 심화 리서치 (`ssr`, `suspensive`, `frontend-interview`)
- `content/diary/` — 개인 회고 다이어리

## Architecture
pnpm 워크스페이스 세 조각이 런타임에 Module Federation 으로 붙는다.

| 패키지 | 역할 | 스택 |
|---|---|---|
| `apps/start` | 호스트. 모든 페이지·SEO·서버 라우트. 글은 content-collections 로 빌드 때 컴파일하고 전부 프리렌더 | TanStack Start 1.x (Vite 8) + `@module-federation/tanstack` + Nitro |
| `apps/remotes` | 글 본문 인터랙티브 데모 22개를 노출하는 리모트 (`./register`) | Vite + React + `@module-federation/vite` (`vite build --app` 으로 SSR 엔트리까지 생성) |
| `packages/ui` | 호스트↔리모트 계약. `<blog-demo name="…">` 커스텀 엘리먼트 + `globalThis` 심볼 레지스트리 | Lit 3 |

- 글(MDX)의 `<ThrottleDemo />` 같은 태그는 `apps/start/src/components/mdx-components.tsx` 가 `<blog-demo name="throttle">` 로 바꾼다. 서버는 태그와 자리 높이만 내보내고, 브라우저에서 리모트가 `registerDemo()` 로 채운다.
- 데모를 추가할 때는 ① `apps/remotes/src/demos/` 에 컴포넌트, ② `apps/remotes/src/register.ts` 의 `demos` 맵, ③ 호스트 `mdx-components.tsx` 의 `DEMO_TAGS` 세 곳을 같은 이름으로 맞춘다.
- React/ReactDOM/Router 는 호스트가 싱글톤으로 공유한다. 리모트에 React 를 번들하지 않는다.
- 비용 원칙: 서버 함수는 조회수 API 하나뿐이다. 페이지는 모두 정적 HTML 이어야 한다(Vercel 함수 1개).

## Tech Stack
- **Host:** TanStack Start (React 19, TypeScript strict), content-collections + remark/rehype + Shiki
- **UI:** Tailwind CSS v4 + 직접 만든 컴포넌트 (`cn()` utility), Lucide React
- **Package manager:** pnpm (workspace)
- **Deployment:** Vercel — 호스트는 Root Directory `apps/start`, 리모트는 Root Directory `apps/remotes`(정적, Output `dist`). 호스트 빌드 환경변수 `DEMOS_ORIGIN` 에 리모트 도메인을 넣는다.

## Commands
- `pnpm dev` — 호스트 개발 서버 (3100). 데모를 보려면 `pnpm dev:remotes`(3001)도 띄운다
- `pnpm build` — 리모트 빌드 후 호스트 빌드(프리렌더). 호스트 프리렌더가 리모트를 서버 렌더하므로 리모트가 3001 에 떠 있어야 한다(`pnpm preview:remotes`)
- `pnpm lint` / `pnpm typecheck` / `pnpm check`
- `pnpm previews` — 본문 링크 미리보기 스크린샷 생성 (로컬 Chrome 필요, 결과는 커밋)
- `pnpm import:docx <file>` — docx 원고를 마크다운으로 변환

## Environment
`.env.example` 참고. `VITE_SITE_URL`, `DEMOS_ORIGIN`, Upstash Redis 자격증명. 없어도 빌드·실행은 되고 조회수 표시만 꺼진다.

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first
- 내부 링크는 `@/components/link` 의 `Link`(href 문자열)를 쓴다. TanStack `Link` 의 `to` 는 라우트 리터럴만 받는다.

## Project Structure
```
apps/start/
  content-collections.ts   # 컬렉션 정의 (posts, postsEn, books, chapters, diaryEntries)
  src/routes/              # 파일 라우트. rss.xml 등 서버 라우트는 server.handlers
  src/components/          # React 컴포넌트 (pages/ 는 두 언어가 공유하는 페이지 본문)
  src/lib/
    content.ts             # 컬렉션 조회 — 서버에서만 동적 import 한다
    server-fns.ts          # 라우트 로더가 부르는 서버 함수
    head.ts                # meta/link 헬퍼
  src/styles/              # globals.css, pretendard.css
  public/                  # covers, images, imports, fonts
apps/remotes/
  src/demos/               # 데모 컴포넌트 (canvas-demo 가 공통 껍데기)
  src/register.ts          # <blog-demo> 레지스트리에 데모 등록
packages/ui/src/           # blog-demo.ts, registry.ts
content/                   # posts (<slug>.mdx 한국어, <slug>.en.mdx 영어), research, diary
scripts/                   # capture-link-previews.mjs, import-docx.mjs
docs/mfe-migration-notes.md # 마이그레이션 결정·문제·측정 기록
```

## 다국어 (posts 한정)

한국어가 기본이라 URL 에 접두사가 없고(`/articles/foo`), 영어만 `/en` 아래로 간다(`/en/articles/foo`).
루트 라우트가 경로를 보고 `<html lang>` 을 정한다.

**한국어 글을 고칠 때는 `<slug>.en.mdx` 가 있는지 먼저 확인하고, 있으면 같이 고친다.**
한쪽만 바꾸면 두 언어가 어긋난다. 상세 규칙은 `.claude/skills/blog-tone` 에 있다.

영어판이 있는 글에만 본문 안에 언어 전환 링크가 뜬다. research 와 diary 는 한국어만 지원한다.

## 블로그 글 작성 규칙 (말투)

`content/posts/`와 `content/research/`의 모든 블로그 글은 **"~다 / ~이다 / ~한다 / ~된다"체(plain 평서체)**로 통일한다. 기술적 사실을 단정적으로 서술하되, 독자를 "우리"로 초대하고 개인 경험은 개념을 이해시키는 예시로만 쓰는 톤이다. 짧은 문장과 긴 문장을 섞어 리듬을 만들고, 전문 용어는 쓰고 나서 바로 설명한다. 상세 규칙과 검증 절차는 `.claude/skills/blog-tone` 스킬에 있다.

- 본문 문장 어미를 "~습니다 / ~합니다 / ~입니다" 존댓말이나 "~해요 / ~하죠 / ~네요 / ~까요?" 구어체로 끝내지 않는다.
- 1인칭 자기 지칭은 "저 / 제가"가 아니라 "필자 / 필자가"로 쓴다.
- 권유·제안은 "~합시다 / ~해 봅시다"가 아니라 "~하자 / ~해보자"로 쓴다. 독자 포함은 "우리".
- 불릿·표의 명사형 종결(예: "~ 처리", "~ 미등록")은 그대로 둬도 된다.
- **변경 대상이 아닌 것**: 코드 블록 내부(코드 및 코드 주석), frontmatter의 `title`. frontmatter의 `description`이 완결된 문장이면 같은 말투를 따른다.

## 다이어리 작성 규칙 (`content/diary/`)

다이어리는 블로그 글과 별개다. **개인 회고체(1인칭 "나" + 평서체 "~다/~했다")를 그대로 유지**한다 — 종결어미는 블로그와 같은 평서체지만, 다이어리는 자기 지칭을 "필자"가 아니라 "나"로 두고 회고 톤을 유지한다.

**사용자가 다이어리 글 본문을 전달하면, 항상 강조 마커를 적절히 입혀서 저장한다.** 기존 글(`2026-04-13-new-employee.mdx` 등)의 톤·밀도를 기준으로 한다.

- `==하이라이트==` — 글의 전환점/핵심 한두 문장에만 (remark-flexible-markers).
- `**굵게**` — 강조하고 싶은 핵심 진술.
- `*기울임*` — 잔잔한 회고/감정 문구.
- `` `코드` `` — 기술 용어·도구/명령어 이름.
- 과하게 칠하지 않는다. 5문단 기준 하이라이트 1~2 / 굵게 2~3 / 기울임 1~2 정도.
- 원문 의미·표현은 보존하고 마커만 더한다. frontmatter는 `date`(필수) + `mood`(내용에 맞는 한 단어).
- 파일명은 `YYYY-MM-DD-<영문-kebab-슬러그>.mdx`.

## MOST IMPORTANT NOTES
- When launching Claude Code agent teams, ALWAYS have each teammate work in their own worktree branch and merge everyone's work at the end, resolving any merge conflicts smartly since you are basically serving the orchestrator role and have full context to our goals, work given, work achieved, and desired outcomes.
- 블로그 글 말투 상세 규칙과 검증 절차는 `.claude/skills/blog-tone` 스킬에 있다.
- 성능 개선이 생기면 수치를 `docs/mfe-migration-notes.md` 에 적고, 글에 넣을 때는 CanvasDemo 스타일 before/after 비교 데모로 만든다.
