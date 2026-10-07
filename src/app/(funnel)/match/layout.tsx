import type { Metadata } from "next";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";
import { isLeadIntakeReady } from "@/lib/lead-intake/security";
import { EnquiryUnavailable } from "@/components/lead-eoi/enquiry-unavailable";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Find Your Match",
  description:
    "Share your property requirements with the Haus of Estate team.",
  alternates: { canonical: "/match" },
  openGraph: {
    title: "Find Your Match — Haus of Estate",
    description:
      "Share your property requirements with the Haus of Estate team.",
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
  if (!isLeadIntakeReady()) return <EnquiryUnavailable />;
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {children}
    </div>
  );
}
