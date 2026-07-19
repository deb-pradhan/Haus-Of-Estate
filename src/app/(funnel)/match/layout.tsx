import type { Metadata } from "next";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Find Your Match",
  description:
    "Answer 5 quick questions. We'll match you with verified Dubai properties that fit your lifestyle, budget, and goals.",
  alternates: { canonical: "/match" },
  openGraph: {
    title: "Find Your Match — Haus of Estate",
    description:
      "Answer 5 quick questions. We'll match you with verified Dubai properties that fit your lifestyle, budget, and goals.",
    url: "/match",
    type: "website",
    images: DEFAULT_OG_IMAGES,
  },
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
