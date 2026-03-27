import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Haus of Estate — Property, with proof.",
  description:
    "The UAE's transaction-first real estate platform. Verified listings, trusted agents, guided transactions.",
  keywords: [
    "Dubai real estate",
    "property UAE",
    "verified listings",
    "buy property Dubai",
  ],
  icons: {
    icon: "/Vector-1.svg",
    apple: "/Vector-1.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable}`}>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
