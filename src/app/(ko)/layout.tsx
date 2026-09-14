import type { Metadata } from "next";
import { RootShell } from "@/components/root-shell";
import { siteMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = siteMetadata("ko");

export default function KoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell locale="ko">{children}</RootShell>;
}
