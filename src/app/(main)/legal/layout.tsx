import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Legal information for Haus of Estate — privacy policy, terms of service and cookie policy.",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-stone-100">{children}</div>;
}