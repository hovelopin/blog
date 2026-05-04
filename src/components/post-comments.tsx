"use client";

import { useEffect, useRef } from "react";

interface PostCommentsProps {
  slug: string;
  title: string;
}

function getGiscusTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function PostComments({ slug, title }: PostCommentsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", "hovelopin/blog");
    script.setAttribute("data-repo-id", "R_kgDOSGx4Ww");
    script.setAttribute("data-category", "Announcements");
    script.setAttribute("data-category-id", "DIC_kwDOSGx4W84C7NBI");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", getGiscusTheme());
    script.setAttribute("data-lang", "ko");
    host.appendChild(script);

    const observer = new MutationObserver(() => {
      const iframe = host.querySelector<HTMLIFrameElement>(
        "iframe.giscus-frame",
      );
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: getGiscusTheme() } } },
        "https://giscus.app",
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      host.innerHTML = "";
    };
  }, [slug, title]);

  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        # comments
      </h2>
      <div ref={ref} />
    </section>
  );
}
