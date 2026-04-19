"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const observer = new MutationObserver(() => {
    for (const fn of listeners) fn();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => {
    listeners.delete(cb);
    observer.disconnect();
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      className={cn(
        "inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/70 text-muted-foreground",
        "transition-colors hover:border-border hover:bg-accent hover:text-foreground",
      )}
    >
      <span suppressHydrationWarning className="inline-flex">
        {theme === "dark" ? (
          <Sun className="h-[15px] w-[15px]" />
        ) : (
          <Moon className="h-[15px] w-[15px]" />
        )}
      </span>
    </button>
  );
}
