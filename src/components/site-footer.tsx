// import Link from "next/link";
// import { Rss } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start justify-between gap-3 px-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <p className="font-mono">
          © {new Date().getFullYear()} hovelopin.
        </p>
        <div className="flex items-center gap-4 font-mono">
          {/* <Link
            href="/rss.xml"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
            aria-label="RSS feed"
          >
            <Rss size={12} aria-hidden="true" /> rss
          </Link> */}
          <span>
            &ldquo;share more, connect deeper.&rdquo;{" "}
            <span className="text-primary">— hojin</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
