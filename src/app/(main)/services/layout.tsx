import type { Metadata } from "next";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Property services from Haus of Estate: introductions to managing agents, staging and furnishing providers, and renovation trades.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Services — Haus of Estate",
    description:
      "Introductions to managing agents, staging and furnishing providers, and renovation trades.",
    url: "/services",
    type: "website",
    images: DEFAULT_OG_IMAGES,
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
