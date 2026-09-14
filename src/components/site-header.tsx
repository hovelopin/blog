"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPaletteTrigger } from "@/components/command-palette-trigger";
import { DEFAULT_LOCALE, localePath, type Locale } from "@/lib/locale";

interface NavChild {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

interface NavItem {
  href: string;
  command: string;
  match: (pathname: string) => boolean;
  /** 있으면 드롭다운으로 그린다. 하나뿐이면 그냥 링크로 접는다. */
  children?: NavChild[];
}

/**
 * 언어별 네비게이션.
 * posts 는 articles(/articles) 와 research(/research) 를 묶는 드롭다운이다.
 * 영어는 글(posts)만 번역하므로 research·diary 가 없고, 그래서 posts 도 평범한 링크가 된다.
 */
function navItemsFor(locale: Locale): NavItem[] {
  const at = (path: string) => localePath(locale, path);
  const home = at("/");
  const posts = at("/articles");
  const articles: NavChild = {
    href: posts,
    label: "cd articles",
    match: (p) => p.startsWith(posts),
  };

  if (locale !== DEFAULT_LOCALE) {
    return [
      { href: home, command: "cd ~", match: (p) => p === home },
      { href: posts, command: "cd ~/posts", match: articles.match },
    ];
  }

  const research: NavChild = {
    href: "/research",
    label: "cd research",
    match: (p) => p.startsWith("/research"),
  };
  return [
    { href: home, command: "cd ~", match: (p) => p === home },
    {
      href: posts,
      // 드롭다운은 디렉터리 안을 펼쳐 보는 동작이라 ls. 실제 이동은 자식들이 cd 로 맡는다.
      command: "ls ~/posts",
      match: (p) => articles.match(p) || research.match(p),
      children: [articles, research],
    },
    { href: "/diary", command: "cd ~/diary", match: (p) => p.startsWith("/diary") },
  ];
}

function promptPathFor(pathname: string): string {
  if (pathname === "/") return "~";
  if (pathname === "/articles") return "~/articles";
  if (pathname === "/research") return "~/research";
  if (pathname === "/diary") return "~/diary";
  if (pathname.startsWith("/articles/")) {
    const slug = pathname.replace("/articles/", "");
    return `~/articles/${slug}`;
  }
  if (pathname.startsWith("/research/")) {
    const rest = pathname.replace("/research/", "");
    return `~/research/${rest}`;
  }
  return pathname;
}

const DESKTOP_ITEM =
  "inline-flex h-[30px] items-center whitespace-nowrap rounded-lg border px-3 font-mono text-[12px] transition-colors";
const DESKTOP_ACTIVE =
  "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_25%,transparent)]";
const DESKTOP_IDLE =
  "border-border/70 text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground";

/**
 * 데스크톱 드롭다운. 마우스를 올리면 열리고 벗어나면 닫힌다.
 *
 * 트리거는 /posts 로 가는 보통 링크다 — 누르면 이동하고, 올려두면 하위 메뉴가 나온다.
 * 트리거에서 메뉴로 커서를 옮기는 사이에 닫히지 않도록 닫기는 살짝 늦춘다.
 * 키보드는 포커스가 들어오면 열리고, 밖으로 나가거나 Escape 면 닫힌다.
 */
function NavDropdown({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const isActive = item.match(pathname);
  const children = item.children ?? [];

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openNow = () => {
    cancelClose();
    setOpen(true);
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelClose();
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={openNow}
      onPointerLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => {
        // 포커스가 트리거·메뉴 바깥으로 나갈 때만 닫는다
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Link
        href={item.href}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          DESKTOP_ITEM,
          // 선택(초록)은 현재 페이지일 때만. 메뉴가 열린 동안은 hover 와 같은 느낌만 유지한다.
          isActive ? DESKTOP_ACTIVE : DESKTOP_IDLE,
          !isActive && open && "border-border bg-accent text-foreground",
        )}
      >
        <span className={cn("mr-1.5", isActive ? "text-primary" : "text-primary/70")}>$</span>
        {item.command}
        <ChevronDown
          className={cn("ml-1.5 h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          strokeWidth={2}
          aria-hidden="true"
        />
      </Link>

      {open && (
        // 트리거와 메뉴 사이 틈에서 pointerleave 가 나지 않도록 위쪽 패딩으로 잇는다
        <div role="menu" className="absolute right-0 top-full z-50 min-w-[160px] pt-1.5">
          <div className="overflow-hidden rounded-lg border border-border/70 bg-popover/95 p-1 shadow-lg backdrop-blur-md">
            {children.map((child, i) => {
              const childActive = child.match(pathname);
              const last = i === children.length - 1;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  role="menuitem"
                  aria-current={childActive ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-md px-2.5 py-1.5 font-mono text-[12px] transition-colors",
                    childActive
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span className="mr-2 text-primary/60">{last ? "└" : "├"}</span>
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const pathname = usePathname();
  const navItems = navItemsFor(locale);
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

  // 헤더는 TOC 아일랜드·back-to-top(z-50) 보다 위, 스크롤 진행바(z-60)·팔레트 보다 아래.
  // 드롭다운 메뉴가 헤더의 스태킹 컨텍스트 안에 있어서 헤더 자체가 아일랜드 위여야 한다.
  return (
    <header className="sticky top-0 z-[55] border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-5xl items-center justify-between gap-3 px-4 sm:h-[65px] sm:px-6">
        <Link
          href={localePath(locale, "/")}
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
            {navItems.map((item) => {
              if (item.children && item.children.length > 1) {
                return <NavDropdown key={item.href} item={item} pathname={pathname} />;
              }
              const isActive = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(DESKTOP_ITEM, isActive ? DESKTOP_ACTIVE : DESKTOP_IDLE)}
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
              {navItems.map((item) => {
                const isActive = item.match(pathname);
                const grouped = item.children && item.children.length > 1;
                return (
                  <div key={item.href} className="flex flex-col gap-1">
                    {grouped ? (
                      // 묶음의 머리글. 자식이 실제 링크를 맡는다.
                      <div
                        className={cn(
                          "flex items-center rounded-lg border border-transparent px-3 py-2.5 font-mono text-[13px]",
                          isActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <span className={cn("mr-2", isActive ? "text-primary" : "text-primary/70")}>
                          $
                        </span>
                        {item.command}
                      </div>
                    ) : (
                      <Link
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
                    )}
                    {grouped &&
                      item.children?.map((child, i) => {
                        const childActive = child.match(pathname);
                        const last = i === (item.children?.length ?? 0) - 1;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            aria-current={childActive ? "page" : undefined}
                            className={cn(
                              "ml-4 flex items-center rounded-lg border px-3 py-2 font-mono text-[13px] transition-colors",
                              childActive
                                ? "border-primary/60 bg-primary/10 text-foreground"
                                : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent hover:text-foreground",
                            )}
                          >
                            <span className="mr-2 text-primary/60">{last ? "└" : "├"}</span>
                            {child.label}
                          </Link>
                        );
                      })}
                  </div>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
