<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 개인 블로그 (hojin-blog)

## What This Is
Next.js 기반 개인 블로그. 글은 `content/` 아래 마크다운으로 관리하고, 빌드 시 정적 페이지로 렌더링한다.
- `content/posts/` — 기술 블로그 글
- `content/research/` — 시리즈 단위 심화 리서치 (`ssr`, `suspensive`, `frontend-interview`)
- `content/diary/` — 개인 회고 다이어리

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Base UI primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React
- **Content:** Markdown + gray-matter, remark/rehype 파이프라인, Shiki 코드 하이라이팅
- **Package manager:** pnpm
- **Deployment:** Vercel

## Commands
- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm lint` — ESLint 검사
- `pnpm typecheck` — TypeScript 검사
- `pnpm check` — lint + typecheck + build
- `pnpm import:docx <file>` — docx 원고를 마크다운으로 변환

## Environment
`.env.example` 참고. 지금은 조회수용 Upstash Redis 자격증명만 쓴다.
없어도 빌드·실행은 되고 조회수 표시만 꺼진다.

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first

## Project Structure
```
src/
  app/              # Next.js 라우트 (posts, research, diary, rss.xml, llms.txt, sitemap, robots)
  components/       # React 컴포넌트
    ui/             # shadcn/ui primitives
  lib/
    content.ts      # 마크다운 로딩/파싱
    site.ts         # 사이트 메타데이터
    utils.ts        # cn() utility
  types/            # TypeScript 인터페이스
  hooks/            # 커스텀 훅
content/
  posts/            # 기술 글
  research/         # 리서치 시리즈
  diary/            # 다이어리
public/
  covers/           # 글 커버 이미지
  images/           # 아바타, 링크 프리뷰, 리서치 이미지
  imports/          # 글 본문에 삽입되는 이미지
scripts/
  import-docx.mjs   # docx → 마크다운 변환 스크립트
```

## 블로그 글 작성 규칙 (말투)

`content/posts/`와 `content/research/`의 모든 블로그 글은 **"~다 / ~이다 / ~한다 / ~된다"체(plain 평서체)**로 통일한다. 기술적 사실을 단정적으로 서술하되, 독자를 "우리"로 초대하고 개인 경험은 개념을 이해시키는 예시로만 쓰는 톤이다. 짧은 문장과 긴 문장을 섞어 리듬을 만들고, 전문 용어는 쓰고 나서 바로 설명한다. 상세 규칙과 검증 절차는 `.claude/skills/blog-tone` 스킬에 있다.

- 본문 문장 어미를 "~습니다 / ~합니다 / ~입니다" 존댓말이나 "~해요 / ~하죠 / ~네요 / ~까요?" 구어체로 끝내지 않는다.
- 1인칭 자기 지칭은 "저 / 제가"가 아니라 "필자 / 필자가"로 쓴다.
- 권유·제안은 "~합시다 / ~해 봅시다"가 아니라 "~하자 / ~해보자"로 쓴다. 독자 포함은 "우리".
- 불릿·표의 명사형 종결(예: "~ 처리", "~ 미등록")은 그대로 둬도 된다.
- **변경 대상이 아닌 것**: 코드 블록 내부(코드 및 코드 주석), frontmatter의 `title`. frontmatter의 `description`이 완결된 문장이면 같은 말투를 따른다.

## 다이어리 작성 규칙 (`content/diary/`)

다이어리는 블로그 글과 별개다. **개인 회고체(1인칭 "나" + 평서체 "~다/~했다")를 그대로 유지**한다 — 종결어미는 블로그와 같은 평서체지만, 다이어리는 자기 지칭을 "필자"가 아니라 "나"로 두고 회고 톤을 유지한다.

**사용자가 다이어리 글 본문을 전달하면, 항상 강조 마커를 적절히 입혀서 저장한다.** 기존 글(`2026-04-13-new-employee.md` 등)의 톤·밀도를 기준으로 한다.

- `==하이라이트==` — 글의 전환점/핵심 한두 문장에만 (remark-flexible-markers).
- `**굵게**` — 강조하고 싶은 핵심 진술.
- `*기울임*` — 잔잔한 회고/감정 문구.
- `` `코드` `` — 기술 용어·도구/명령어 이름.
- 과하게 칠하지 않는다. 5문단 기준 하이라이트 1~2 / 굵게 2~3 / 기울임 1~2 정도.
- 원문 의미·표현은 보존하고 마커만 더한다. frontmatter는 `date`(필수) + `mood`(내용에 맞는 한 단어).
- 파일명은 `YYYY-MM-DD-<영문-kebab-슬러그>.md`.

## MOST IMPORTANT NOTES
- When launching Claude Code agent teams, ALWAYS have each teammate work in their own worktree branch and merge everyone's work at the end, resolving any merge conflicts smartly since you are basically serving the orchestrator role and have full context to our goals, work given, work achieved, and desired outcomes.
- 블로그 글 말투 상세 규칙과 검증 절차는 `.claude/skills/blog-tone` 스킬에 있다.
