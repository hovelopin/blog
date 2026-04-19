"use client";

import { useEffect, useRef } from "react";

interface PostCommentsProps {
  slug: string;
  title: string;
}

const REPO = process.env.NEXT_PUBLIC_GISCUS_REPO;
const REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

function getGiscusTheme(): string {
  return document.documentElement.classList.contains("dark")
    ? "dark_dimmed"
    : "light";
}

export function PostComments({ slug, title }: PostCommentsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!REPO || !REPO_ID || !CATEGORY || !CATEGORY_ID) return;
    const host = ref.current;
    if (!host) return;
    host.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", REPO);
    script.setAttribute("data-repo-id", REPO_ID);
    script.setAttribute("data-category", CATEGORY);
    script.setAttribute("data-category-id", CATEGORY_ID);
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", slug);
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", getGiscusTheme());
    script.setAttribute("data-lang", "ko");
    script.setAttribute("data-loading", "lazy");
    host.appendChild(script);

    const observer = new MutationObserver(() => {
      const iframe = document.querySelector<HTMLIFrameElement>(
        "iframe.giscus-frame",
      );
      iframe?.contentWindow?.postMessage(
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

  if (!REPO || !REPO_ID || !CATEGORY || !CATEGORY_ID) return null;

  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        # comments
      </h2>
      <div ref={ref} />
    </section>
  );
}
