import type { Metadata } from "next";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description:
    "Haus of Estate is an international property service for buyers, landlords and investors moving across borders. We introduce you to estate agents and brokers in each market, with one clear starting point for your enquiry.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Haus of Estate",
    description:
      "Haus of Estate is an international property service for buyers, landlords and investors moving across borders. We introduce you to estate agents and brokers in each market, with one clear starting point for your enquiry.",
    url: "/about",
    type: "website",
    images: DEFAULT_OG_IMAGES,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
