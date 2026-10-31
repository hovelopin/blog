import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
