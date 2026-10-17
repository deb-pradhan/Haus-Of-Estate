import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// list-property/page.tsx is a client component and cannot export metadata, so
// this server layout supplies the page's own title, description and canonical.
export const metadata: Metadata = pageMetadata({
  title: "Sell or Let Your Property",
  description:
    "Tell us about the property you want to sell or let overseas. We introduce you to a local agent. Enquire free; an advisor will reply as soon as they can.",
  path: "/list-property",
});

export default function ListPropertyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
