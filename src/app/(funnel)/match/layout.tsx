import type { Metadata } from "next";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Find Your Match",
  description:
    "Answer five quick questions about your budget and goals. A local Haus of Estate advisor will prepare a shortlist for Dubai, the UK or Bali.",
  alternates: { canonical: "/match" },
  // A lead-capture tool, not content: keep it out of the index.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Find Your Match — Haus of Estate",
    description:
      "Answer five quick questions about your budget and goals. A local Haus of Estate advisor will prepare a shortlist for Dubai, the UK or Bali.",
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
