import type { Metadata } from "next";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Property services from Haus of Estate — property management, sourcing, interiors, renovations and maintenance.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Services — Haus of Estate",
    description:
      "Property management, sourcing, interiors, renovations and maintenance from Haus of Estate.",
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
