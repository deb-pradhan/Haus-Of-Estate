import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Find Your Match — Haus of Estate",
  description:
    "Answer 5 quick questions. We'll match you with verified Dubai properties that fit your lifestyle, budget, and goals.",
};

export default function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {children}
    </div>
  );
}
