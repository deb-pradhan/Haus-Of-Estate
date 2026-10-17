import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { Suspense } from "react";
import { draftMode } from "next/headers";
import { ConsentManager } from "@/components/analytics/consent-manager";
import { JsonLd } from "@/components/seo/json-ld";
import { COMPANY_IDENTITY } from "@/lib/company-identity";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL, siteJsonLd } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  // `default` is used by the home page (and any page without its own title);
  // `template` appends the brand to bare page titles, e.g. "Properties" →
  // "Properties | Haus of Estate". Pages therefore set only their page name
  // (keep it under 43 characters so the whole title fits in 60).
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { telephone: false, address: false, email: false },
  // Deliberately NO global `alternates.canonical`: a canonical set here is
  // inherited by every page that does not override it (it used to point
  // /list-property and /auth/* at the homepage). Every indexable route
  // declares its own self-referencing canonical; see pageMetadata() in
  // src/lib/seo.ts.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  // og:image / twitter:image are supplied automatically by the
  // src/app/opengraph-image.png and twitter-image.png file conventions.
  // No og:url / title / description here for the same reason as the canonical
  // above: they would be inherited by pages that define no social block of
  // their own. Next fills og:title/description from the page's own metadata.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  // Favicon, SVG icon and apple-touch-icon are provided by the App Router
  // file conventions (src/app/favicon.ico, icon.svg, apple-icon.png).
  // The web manifest link is injected automatically by src/app/manifest.ts.
};

export const viewport: Viewport = {
  themeColor: "#1F4F2F",
  colorScheme: "light",
};

// Site-wide structured data: one Organization/RealEstateAgent node + WebSite.
// Address, phone and email come from COMPANY_IDENTITY / src/lib/seo.ts only.
const jsonLd = siteJsonLd(COMPANY_IDENTITY);

// Optional public IDs, embedded at build time. A valid GTM container takes
// precedence; otherwise a GA4 measurement ID loads gtag.js directly. Either
// loads only after analytics consent, on a public production page outside draft mode.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const ANALYTICS_ALLOWED_HOSTS = process.env.NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isEnabled: isDraftModeEnabled } = await draftMode();

  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <JsonLd data={jsonLd} />
      </head>
      <body className={`${inter.variable} ${cormorant.variable}`}>
        <Suspense fallback={null}>
          <ConsentManager
            gtmId={GTM_ID}
            ga4Id={GA4_ID}
            draft={isDraftModeEnabled}
            allowedHosts={ANALYTICS_ALLOWED_HOSTS}
            production={process.env.NODE_ENV === "production" && (process.env.VERCEL_ENV !== "preview" || Boolean(ANALYTICS_ALLOWED_HOSTS?.trim()))}
          />
        </Suspense>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-estate-700 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        {children}
        {isDraftModeEnabled && (
          <div className="fixed bottom-4 right-4 z-50 rounded-full bg-estate-700 px-4 py-2 text-sm text-white shadow-lg">
            Preview Mode
          </div>
        )}
      </body>
    </html>
  );
}
