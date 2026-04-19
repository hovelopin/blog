"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPaletteTrigger } from "@/components/command-palette-trigger";

interface NavItem {
  href: string;
  command: string;
  short: string;
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    command: "cd ~",
    short: "~",
    match: (p) => p === "/",
  },
  {
    href: "/blog",
    command: "cd ~/blog",
    short: "blog",
    match: (p) => p === "/blog" || p.startsWith("/posts"),
  },
  {
    href: "/diary",
    command: "cd ~/diary",
    short: "diary",
    match: (p) => p.startsWith("/diary"),
  },
];

function promptPathFor(pathname: string): string {
  if (pathname === "/") return "~";
  if (pathname === "/blog") return "~/blog";
  if (pathname === "/diary") return "~/diary";
  if (pathname.startsWith("/posts/")) {
    const slug = pathname.replace("/posts/", "");
    return `~/blog/${slug}`;
  }
  return pathname;
}

export function SiteHeader() {
  const pathname = usePathname();
  const promptPath = promptPathFor(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-5xl items-center justify-between gap-3 px-4 sm:h-[65px] sm:px-6">
        <Link
          href="/"
          aria-label="home"
          className="group flex shrink-0 items-center gap-1 font-mono text-[13px] text-foreground transition-opacity hover:opacity-80 sm:text-sm"
        >
          <span className="text-muted-foreground">~/</span>
          <span className="font-medium">hovelopin</span>
          <span className="ml-0.5 hidden text-muted-foreground sm:inline">
            : {promptPath}
          </span>
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-[1px] bg-primary/90 animate-[cursor-blink_1.1s_steps(1)_infinite] sm:h-[15px] sm:w-[8px]"
          />
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <CommandPaletteTrigger />
          <ThemeToggle />
          {NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-[30px] items-center rounded-lg border font-mono text-[11.5px] transition-colors sm:text-[12px]",
                  "px-2.5 sm:px-3",
                  isActive
                    ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_25%,transparent)]"
                    : "border-border/70 text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 hidden sm:inline",
                    isActive ? "text-primary" : "text-primary/70",
                  )}
                >
                  $
                </span>
                <span className="hidden sm:inline">{item.command}</span>
                <span className="sm:hidden">
                  <span className="mr-1 text-primary/80">$</span>
                  {item.short}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
