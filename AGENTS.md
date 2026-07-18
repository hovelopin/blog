<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Website Reverse-Engineer Template

## What This Is
A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. The Next.js + shadcn/ui + Tailwind v4 base is pre-scaffolded — just run `/clone-website <url1> [<url2> ...]`.

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — will be replaced/supplemented by extracted SVGs)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Deployment:** Vercel

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run check` — Run lint + typecheck + build

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first

## Design Principles
- **Pixel-perfect emulation** — match the target's spacing, colors, typography exactly
- **No personal aesthetic changes during emulation phase** — match 1:1 first, customize later
- **Real content** — use actual text and assets from the target site, not placeholders
- **Beauty-first** — every pixel matters

## Project Structure
```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons as React components
  lib/
    utils.ts        # cn() utility (shadcn)
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  images/           # Downloaded images from target site
  videos/           # Downloaded videos from target site
  seo/              # Favicons, OG images, webmanifest
docs/
  research/         # Inspection output (design tokens, components, layout)
  design-references/ # Screenshots and visual references
scripts/            # Asset download scripts
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
- After editing `.claude/skills/clone-website/SKILL.md`, run `node scripts/sync-skills.mjs` to regenerate the skill for all platforms.

@docs/research/INSPECTION_GUIDE.md
