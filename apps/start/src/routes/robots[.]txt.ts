import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";

// GEO: AI 답변/검색 엔진 크롤러를 명시적으로 허용한다.
const AGENTS = [
  "*",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const rules = AGENTS.map((ua) => `User-agent: ${ua}\nAllow: /`).join("\n\n");
        const body = `${rules}\n\nHost: ${SITE_URL}\nSitemap: ${SITE_URL}/sitemap.xml\n`;
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
