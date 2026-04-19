"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Newspaper,
  NotebookPen,
  Rss,
  Search,
  SunMoon,
  Tag as TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PalettePost {
  slug: string;
  title: string;
  description: string;
  tags?: string[];
  date: string;
}

interface CommandPaletteProps {
  posts: PalettePost[];
  tags: { tag: string; count: number }[];
}

type Item =
  | {
      kind: "post";
      id: string;
      label: string;
      hint: string;
      href: string;
      keywords: string;
    }
  | {
      kind: "nav";
      id: string;
      label: string;
      hint: string;
      href: string;
      icon: "home" | "blog" | "diary" | "rss";
      keywords: string;
    }
  | {
      kind: "tag";
      id: string;
      label: string;
      hint: string;
      href: string;
      keywords: string;
    }
  | {
      kind: "action";
      id: string;
      label: string;
      hint: string;
      run: () => void;
      keywords: string;
    };

function fuzzyScore(query: string, target: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) {
    return 100 - t.indexOf(q);
  }
  let ti = 0;
  let score = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    score += 1 / (found - ti + 1);
    ti = found + 1;
  }
  return score;
}

function IconFor({ name }: { name: "home" | "blog" | "diary" | "rss" }) {
  if (name === "home") return <Home size={14} aria-hidden="true" />;
  if (name === "blog") return <Newspaper size={14} aria-hidden="true" />;
  if (name === "diary") return <NotebookPen size={14} aria-hidden="true" />;
  return <Rss size={14} aria-hidden="true" />;
}

export function CommandPalette({ posts, tags }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    const html = document.documentElement;
    const next = html.classList.contains("dark") ? "light" : "dark";
    if (next === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = [
      {
        kind: "nav",
        id: "nav:home",
        label: "Home",
        hint: "~/",
        href: "/",
        icon: "home",
        keywords: "home root cd ~",
      },
      {
        kind: "nav",
        id: "nav:blog",
        label: "Blog",
        hint: "~/blog",
        href: "/blog",
        icon: "blog",
        keywords: "blog posts ls",
      },
      {
        kind: "nav",
        id: "nav:diary",
        label: "Diary",
        hint: "~/diary",
        href: "/diary",
        icon: "diary",
        keywords: "diary log",
      },
      {
        kind: "nav",
        id: "nav:rss",
        label: "RSS feed",
        hint: "/rss.xml",
        href: "/rss.xml",
        icon: "rss",
        keywords: "rss feed subscribe",
      },
    ];
    const actions: Item[] = [
      {
        kind: "action",
        id: "action:theme",
        label: "Toggle theme",
        hint: "light ↔ dark",
        run: toggleTheme,
        keywords: "theme dark light mode toggle",
      },
    ];
    const postItems: Item[] = posts.map((p) => ({
      kind: "post",
      id: `post:${p.slug}`,
      label: p.title,
      hint: p.date,
      href: `/posts/${p.slug}`,
      keywords: `${p.title} ${p.description} ${(p.tags ?? []).join(" ")} ${p.slug}`,
    }));
    const tagItems: Item[] = tags.map(({ tag, count }) => ({
      kind: "tag",
      id: `tag:${tag}`,
      label: `#${tag}`,
      hint: `${count} posts`,
      href: `/blog/tag/${encodeURIComponent(tag)}`,
      keywords: `tag ${tag}`,
    }));
    return [...nav, ...actions, ...postItems, ...tagItems];
  }, [posts, tags]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return items.slice(0, 20);
    }
    return items
      .map((item) => {
        const score = Math.max(
          fuzzyScore(query, item.label),
          fuzzyScore(query, item.keywords),
        );
        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((x) => x.item);
  }, [query, items]);

  useEffect(() => {
    const openPalette = () => {
      setOpen(true);
      setQuery("");
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 10);
    };
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else openPalette();
      } else if (e.key === "/" && !open) {
        const t = e.target as HTMLElement | null;
        if (
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable)
        )
          return;
        e.preventDefault();
        openPalette();
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${cursor}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor, open, filtered.length]);

  const runItem = (item: Item) => {
    setOpen(false);
    if (item.kind === "action") {
      item.run();
    } else {
      router.push(item.href);
    }
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = filtered[cursor];
      if (pick) runItem(pick);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border/60 px-3">
          <Search
            size={16}
            className="text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search posts, tags, pages…"
            className="h-12 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden items-center rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto py-2"
          role="listbox"
          aria-label="Results"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center font-mono text-xs text-muted-foreground">
              no matches.
            </p>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === cursor;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-idx={idx}
                  onMouseEnter={() => setCursor(idx)}
                  onClick={() => runItem(item)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                    active ? "bg-muted/60" : "hover:bg-muted/40",
                  )}
                  role="option"
                  aria-selected={active}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-[10px]",
                      active
                        ? "border-primary/60 text-primary"
                        : "border-border/70 text-muted-foreground",
                    )}
                  >
                    {item.kind === "post" ? (
                      "#"
                    ) : item.kind === "tag" ? (
                      <TagIcon size={12} aria-hidden="true" />
                    ) : item.kind === "nav" ? (
                      <IconFor name={item.icon} />
                    ) : (
                      <SunMoon size={12} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">
                      {item.label}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      {item.hint}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {item.kind}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border/70 bg-muted/40 px-1 py-0.5">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-border/70 bg-muted/40 px-1 py-0.5">
                ↵
              </kbd>{" "}
              open
            </span>
          </span>
          <span>
            <kbd className="rounded border border-border/70 bg-muted/40 px-1 py-0.5">
              ⌘K
            </kbd>{" "}
            toggle
          </span>
        </div>
      </div>
    </div>
  );
}
