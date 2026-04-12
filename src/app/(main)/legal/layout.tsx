import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — Haus of Estate",
  description: "Legal information for Haus of Estate",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-stone-100">{children}</div>;
}