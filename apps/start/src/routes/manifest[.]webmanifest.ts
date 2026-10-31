import { createFileRoute } from "@tanstack/react-router";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "@/lib/site";

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          {
            name: SITE_NAME,
            short_name: SITE_SHORT_NAME,
            description: SITE_DESCRIPTION,
            start_url: "/",
            display: "standalone",
            background_color: "#0a0a0a",
            theme_color: "#0a0a0a",
            icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
          },
          {
            headers: {
              "Content-Type": "application/manifest+json; charset=utf-8",
              "Cache-Control": "public, max-age=86400",
            },
          },
        ),
    },
  },
});
