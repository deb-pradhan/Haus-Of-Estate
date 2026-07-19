import type { Metadata } from "next";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Services",
  description:
    "End-to-end property services from Haus of Estate — property management, sourcing, interiors and renovations, backed by vetted specialists and transparent workflows.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Services — Haus of Estate",
    description:
      "End-to-end property services — property management, sourcing, interiors and renovations, backed by vetted specialists.",
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
