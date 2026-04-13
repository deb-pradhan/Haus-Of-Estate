import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/lib/auth/client";
import { draftMode } from "next/headers";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isEnabled: isDraftModeEnabled } = await draftMode();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable}`}>
        <SessionProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          {isDraftModeEnabled && (
            <div className="fixed bottom-4 right-4 z-50 rounded-full bg-estate-700 px-4 py-2 text-sm text-white shadow-lg">
              Preview Mode
            </div>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}