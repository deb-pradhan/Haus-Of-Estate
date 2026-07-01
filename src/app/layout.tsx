import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
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

const SITE_URL = "https://hausofestate.com";
const SITE_NAME = "Haus of Estate";
const DEFAULT_TITLE = "Haus of Estate — international property, with proof.";
const DEFAULT_DESCRIPTION =
  "International property service for buyers and investors in Dubai, UK, Bali and Cyprus. Vetted agents, no hidden fees. Free enquiry replied to within 2 hours.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Plain string (not a template): pages set their own full titles, most of
  // which already end with "| Haus of Estate" — a `%s | …` template would
  // double the brand suffix. Pages without a title fall back to this.
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "international property",
    "overseas property UK",
    "Dubai property",
    "estate agents UAE",
    "buy property abroad",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    locale: "en_GB",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-default.png"],
  },
  icons: {
    icon: "/Vector-1.svg",
    apple: "/Vector-1.svg",
  },
};

// Site-wide structured data (JSON-LD) for SEO rich results.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/Vector-1.svg`,
      sameAs: [
        "https://www.linkedin.com/company/haus-of-estate/",
        "https://www.youtube.com/@hausofestate",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: "+971585607033",
        email: "info@hausofestate.com",
        areaServed: ["GB", "AE"],
        availableLanguage: ["en"],
      },
    },
    {
      "@type": "RealEstateAgent",
      "@id": `${SITE_URL}/#realestateagent`,
      name: SITE_NAME,
      url: SITE_URL,
      telephone: "+971585607033",
      email: "info@hausofestate.com",
      areaServed: ["GB", "AE", "ID", "CY"],
      priceRange: "$$$",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
    },
  ],
};

// Google Tag Manager: no-op until the founder sets NEXT_PUBLIC_GTM_ID once the
// GTM container exists. Without the env var, no analytics markup is rendered.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isEnabled: isDraftModeEnabled } = await draftMode();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {GTM_ID && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
      </head>
      <body className={`${inter.variable} ${cormorant.variable}`}>
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-estate-700 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
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