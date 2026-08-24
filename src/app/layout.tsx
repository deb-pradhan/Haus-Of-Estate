import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
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
  // `default` is used by the home page (and any page without its own title);
  // `template` appends the brand to bare page titles, e.g. "Properties" →
  // "Properties — Haus of Estate". Pages therefore set only their page name.
  title: {
    default: DEFAULT_TITLE,
    template: "%s — Haus of Estate",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "international property",
    "overseas property UK",
    "Dubai property",
    "estate agents UAE",
    "buy property abroad",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { telephone: false, address: false, email: false },
  alternates: {
    canonical: "/",
  },
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
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
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
        "https://www.instagram.com/haus_of_estate/",
        "https://www.linkedin.com/company/115804984/",
        "https://www.facebook.com/profile.php?id=61560983191278",
        "https://in.pinterest.com/hausofestate/",
        "https://www.youtube.com/@Hausofestate",
        "https://x.com/hausofestate",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: "+447496033321",
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
      telephone: "+447496033321",
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
