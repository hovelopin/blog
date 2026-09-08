"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPaletteTrigger } from "@/components/command-palette-trigger";

interface NavItem {
  href: string;
  command: string;
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    command: "cd ~",
    match: (p) => p === "/",
  },
  {
    href: "/posts",
    command: "cd ~/posts",
    match: (p) => p.startsWith("/posts"),
  },
  {
    href: "/research",
    command: "cd ~/research",
    match: (p) => p.startsWith("/research"),
  },
  {
    href: "/diary",
    command: "cd ~/diary",
    match: (p) => p.startsWith("/diary"),
  },
];

function promptPathFor(pathname: string): string {
  if (pathname === "/") return "~";
  if (pathname === "/posts") return "~/posts";
  if (pathname === "/research") return "~/research";
  if (pathname === "/diary") return "~/diary";
  if (pathname.startsWith("/posts/")) {
    const slug = pathname.replace("/posts/", "");
    return `~/posts/${slug}`;
  }
  if (pathname.startsWith("/research/")) {
    const rest = pathname.replace("/research/", "");
    return `~/research/${rest}`;
  }
  return pathname;
}

export function SiteHeader() {
  const pathname = usePathname();
  const promptPath = promptPathFor(pathname);
  const [open, setOpen] = useState(false);

  // 경로가 바뀌면 모바일 메뉴를 닫는다.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape로 닫기.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-5xl items-center justify-between gap-3 px-4 sm:h-[65px] sm:px-6">
        <Link
          href="/"
          aria-label="home"
          title={`~/${promptPath}`}
          className="group flex min-w-0 shrink items-center gap-1 font-mono text-[13px] text-foreground transition-opacity hover:opacity-80 sm:text-sm"
        >
          <span className="shrink-0 text-muted-foreground">~/</span>
          <span className="shrink-0 font-medium">hovelopin</span>
          <span className="ml-0.5 hidden min-w-0 max-w-[160px] truncate text-muted-foreground lg:inline-block xl:max-w-[300px]">
            : {promptPath}
          </span>
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[14px] w-[7px] shrink-0 translate-y-[1px] bg-primary/90 animate-[cursor-blink_1.1s_steps(1)_infinite] sm:h-[15px] sm:w-[8px]"
          />
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <CommandPaletteTrigger />
          <ThemeToggle />

          {/* 데스크톱: 인라인 네비게이션 */}
          <div className="hidden items-center gap-2 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex h-[30px] items-center whitespace-nowrap rounded-lg border px-3 font-mono text-[12px] transition-colors",
                    isActive
                      ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_25%,transparent)]"
                      : "border-border/70 text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span className={cn("mr-1.5", isActive ? "text-primary" : "text-primary/70")}>
                    $
                  </span>
                  {item.command}
                </Link>
              );
            })}
          </div>

          {/* 모바일: 햄버거 버튼 */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className={cn(
              "inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border transition-colors lg:hidden",
              open
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border/70 text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
            )}
          >
            {open ? (
              <X className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </nav>
      </div>

      {/* 모바일: 드롭다운 패널 + 바깥 클릭 닫기 백드롭 */}
      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[60px] z-30 cursor-default bg-background/40 backdrop-blur-[1px] sm:top-[65px] lg:hidden"
          />
          <div
            id="mobile-nav"
            className="relative z-40 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden"
          >
            <nav className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-3 sm:px-6">
              {NAV_ITEMS.map((item) => {
                const isActive = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center rounded-lg border px-3 py-2.5 font-mono text-[13px] transition-colors",
                      isActive
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <span className={cn("mr-2", isActive ? "text-primary" : "text-primary/70")}>
                      $
                    </span>
                    {item.command}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
