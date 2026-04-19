"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}
function getMacSnapshot(): boolean {
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}
function getServerSnapshot(): boolean {
  return true;
}

export function CommandPaletteTrigger() {
  const mac = useSyncExternalStore(subscribe, getMacSnapshot, getServerSnapshot);

  const open = () => {
    const e = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: !mac,
      bubbles: true,
    });
    window.dispatchEvent(e);
  };

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open command palette"
      className={cn(
        "inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-border/70 px-2 font-mono text-[11.5px] text-muted-foreground transition-colors",
        "hover:border-border hover:bg-accent hover:text-foreground sm:px-2.5",
      )}
    >
      <Search size={13} aria-hidden="true" />
      <span className="hidden sm:inline">search</span>
      <kbd
        suppressHydrationWarning
        className="hidden rounded border border-border/70 bg-muted/40 px-1 py-0 text-[10px] text-muted-foreground sm:inline"
      >
        {mac ? "⌘K" : "^K"}
      </kbd>
    </button>
  );
}
