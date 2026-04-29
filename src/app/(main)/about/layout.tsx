import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Haus of Estate — international property, with proof.",
  description:
    "Haus of Estate is an international property service for buyers, landlords and investors moving across borders. Vetted specialists, unbiased market data, and a single clear pathway from first enquiry to completion.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
