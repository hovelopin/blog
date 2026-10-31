import { createFileRoute } from "@tanstack/react-router";
import { formatDate } from "@/lib/format";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * llms.txt — LLM/AI 답변엔진이 사이트를 빠르게 이해하도록 돕는 마크다운 인덱스.
 * https://llmstxt.org 규격. draft 글은 getAllPostSummaries 에서 이미 제외된다.
 */
export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const c = await import("@/lib/content");
        const posts = c.getAllPostSummaries();
        const diary = c.getAllDiaryEntries();

        const lines: string[] = [
          `# ${SITE_NAME}`,
          "",
          `> ${SITE_DESCRIPTION}`,
          "",
          `- [RSS feed](${SITE_URL}/rss.xml)`,
          "",
          "## Articles",
          "",
          ...posts.map((p) => `- [${p.title}](${SITE_URL}/articles/${p.slug}): ${p.description}`),
          "",
          "## Diary",
          "",
          ...diary.map((d) => {
            const mood = d.mood ? ` (${d.mood})` : "";
            return `- [diary · ${formatDate(d.date)}${mood}](${SITE_URL}/diary/${d.slug})`;
          }),
          "",
        ];

        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
