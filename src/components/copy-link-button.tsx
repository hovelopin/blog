"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyLinkButtonProps {
  /** 복사할 절대 경로 (예: "/diary/2026-05-15-..."). origin은 런타임에 붙인다. */
  path: string;
  className?: string;
}

export function CopyLinkButton({ path, className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없거나 비보안 컨텍스트인 경우 조용히 무시한다.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "링크 복사됨" : "이 글 링크 복사"}
      title={copied ? "복사됨!" : "이 글 링크 복사"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 transition-colors",
        copied ? "text-primary" : "text-muted-foreground/50 hover:text-primary",
        className,
      )}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
      <span
        aria-live="polite"
        className={cn(
          "font-mono text-[10px] leading-none transition-opacity",
          copied ? "opacity-100" : "sr-only opacity-0",
        )}
      >
        copied
      </span>
    </button>
  );
}
