import type { Metadata } from "next";
import { RootShell } from "@/components/root-shell";
import { siteMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = siteMetadata("en");

export default function EnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell locale="en">{children}</RootShell>;
}
