// Shared SEO helpers: constants, metadata builders, JSON-LD builders, sitemap
// assembly and blog/property metadata rules.
//
// This file is deliberately dependency-free at runtime (type-only imports) so
// it can be unit-tested with plain `node --test` (tests/technical-seo.test.mjs).
// Anything that needs Sanity, React or company-identity is passed in by the
// caller instead of imported here.
import type { Metadata, MetadataRoute } from "next";

export const SITE_URL = "https://hausofestate.com";
export const SITE_NAME = "Haus of Estate";
export const SITE_LOCALE = "en-GB";

// The default social share image is generated from the App Router file
// convention at src/app/opengraph-image.png (served at /opengraph-image.png).
// Pages that define their own `openGraph` object must reference it explicitly,
// because Next.js only auto-applies the file convention to segments that do
// not define `openGraph.images`.
export const DEFAULT_OG_IMAGE = "/opengraph-image.png";

export const DEFAULT_OG_IMAGES = [
  {
    url: DEFAULT_OG_IMAGE,
    width: 1200,
    height: 630,
    alt: "Haus of Estate — property, with proof.",
  },
];

// Homepage / site-wide defaults. Neutral wording only: no response-time SLA,
// no "vetted"/"no hidden fees" promises, no client counts or ratings.
export const DEFAULT_TITLE = "Overseas Property: Dubai, UK, Bali & Cyprus | Haus of Estate";
export const DEFAULT_DESCRIPTION =
  "We introduce overseas buyers and investors to local estate agents in Dubai, the UK, Bali and Cyprus. Enquire free; an advisor will reply as soon as they can.";

// Length guidance used by the unit tests and by the helpers below.
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;

/** Neutral enquiry line that is safe to append to short descriptions. */
export const ENQUIRY_SUFFIX = "Enquire free; an advisor will reply as soon as they can.";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Collapse whitespace and trim. */
export function squash(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Truncate to `max` characters at a word boundary, appending an ellipsis
 * (counted inside the limit). Strings already within the limit are returned
 * unchanged.
 */
export function truncateAtWord(text: string, max: number): string {
  const clean = squash(text);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s,;:\-–—(]+$/, "")}…`;
}

// ── Page metadata ────────────────────────────────────────────────────────────

export interface PageMetadataInput {
  /** Short page name. The root template appends " | Haus of Estate". */
  title: string;
  /** Use when the title already carries its own wording/brand. */
  absoluteTitle?: string;
  description: string;
  /** Path of this page, e.g. "/list-property". Becomes the self-canonical. */
  path: string;
  /** noindex,follow for funnels and utility pages. */
  noindex?: boolean;
  openGraphType?: "website" | "article";
  images?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
}

/**
 * One-stop metadata builder for static pages: self-referencing canonical,
 * matching Open Graph / Twitter blocks and the default share image.
 * Use it from `generateMetadata` or a layout.tsx wrapper for client pages.
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const ogTitle = input.absoluteTitle ?? `${input.title} | ${SITE_NAME}`;
  const images = input.images ?? DEFAULT_OG_IMAGES;
  return {
    title: input.absoluteTitle ? { absolute: input.absoluteTitle } : input.title,
    description: input.description,
    alternates: { canonical: input.path },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: ogTitle,
      description: input.description,
      url: input.path,
      type: input.openGraphType ?? "website",
      siteName: SITE_NAME,
      locale: "en_GB",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: input.description,
      images: images.map((image) => image.url),
    },
  };
}

// ── Structured data (JSON-LD) ────────────────────────────────────────────────

export type JsonLdNode = Record<string, unknown>;

/** The subset of COMPANY_IDENTITY (src/lib/company-identity.ts) used for JSON-LD. */
export interface CompanyIdentityLike {
  name: string;
  legalName: string;
  number: string;
  /** "Haus Of Estate, 115 City Road, Unit 1, Cardiff, South Glamorgan, United Kingdom, CF24 3BP" */
  registeredOffice: string;
  generalEmail?: string;
}

const COUNTRY_CODES: Record<string, string> = {
  "united kingdom": "GB",
  uk: "GB",
  england: "GB",
  wales: "GB",
};

/**
 * Turn the registered-office line from company-identity.ts into a PostalAddress,
 * so JSON-LD can never drift from the legal address. Expected shape:
 * "<name>, <street...>, <locality>, <region>, <country>, <postcode>".
 * Anything that does not fit keeps the full line as the street address.
 */
export function postalAddressFromRegisteredOffice(office: string): JsonLdNode {
  const parts = office.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 6) return { "@type": "PostalAddress", streetAddress: squash(office), addressCountry: "GB" };
  const [postalCode, country, addressRegion, addressLocality] = parts.slice(-4).reverse();
  return {
    "@type": "PostalAddress",
    streetAddress: parts.slice(1, -4).join(", "),
    addressLocality,
    addressRegion,
    postalCode,
    addressCountry: COUNTRY_CODES[country.toLowerCase()] ?? country,
  };
}

// Contact details shown across the site (header, footer, contact page, about).
// UK line is the primary phone; the UAE number is the WhatsApp/UAE line.
export const ORGANIZATION_CONTACT = {
  email: "info@hausofestate.com",
  ukPhone: "+447496033321",
  uaePhone: "+971585607033",
} as const;

export const ORGANIZATION_SAME_AS = [
  "https://www.instagram.com/haus_of_estate/",
  "https://www.linkedin.com/company/115804984/",
  "https://www.facebook.com/profile.php?id=61560983191278",
  "https://in.pinterest.com/hausofestate/",
  "https://www.youtube.com/@Hausofestate",
  "https://x.com/hausofestate",
];

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Site-wide graph: ONE Organization + RealEstateAgent node (single address,
 * phone and email) and a WebSite node. No Offer, RealEstateListing, Review or
 * AggregateRating markup: the company is newly authorised and review data is
 * unverified. No SearchAction: /properties has no free-text query parameter.
 */
export function siteJsonLd(identity: CompanyIdentityLike): JsonLdNode {
  const email = identity.generalEmail ?? ORGANIZATION_CONTACT.email;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "RealEstateAgent"],
        "@id": ORGANIZATION_ID,
        name: identity.name,
        legalName: identity.legalName,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon-512.png`,
          width: 512,
          height: 512,
        },
        description: DEFAULT_DESCRIPTION,
        identifier: {
          "@type": "PropertyValue",
          propertyID: "Companies House company number",
          value: identity.number,
        },
        address: postalAddressFromRegisteredOffice(identity.registeredOffice),
        telephone: ORGANIZATION_CONTACT.ukPhone,
        email,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            name: "UK line",
            telephone: ORGANIZATION_CONTACT.ukPhone,
            email,
            areaServed: ["GB"],
            availableLanguage: ["en"],
          },
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            name: "UAE and WhatsApp line",
            telephone: ORGANIZATION_CONTACT.uaePhone,
            email,
            areaServed: ["AE"],
            availableLanguage: ["en"],
          },
        ],
        areaServed: [
          { "@type": "Country", name: "United Arab Emirates" },
          { "@type": "Country", name: "United Kingdom" },
          { "@type": "Country", name: "Indonesia" },
          { "@type": "Country", name: "Cyprus" },
        ],
        sameAs: ORGANIZATION_SAME_AS,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: SITE_LOCALE,
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Path ("/blog") or absolute URL. */
  path: string;
}

/**
 * BreadcrumbList for any page. Pass the full trail including Home and the
 * current page, e.g. [{name:"Home",path:"/"},{name:"Insights",path:"/blog"}].
 * Render with <JsonLd data={breadcrumbJsonLd(items)} />.
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface FaqEntry {
  question: string;
  /** Plain text answer (no HTML). */
  answer: string;
}

/** FAQPage JSON-LD. Returns null when there is nothing real to mark up. */
export function faqJsonLd(entries: FaqEntry[]): JsonLdNode | null {
  const mainEntity = entries
    .map((entry) => ({ q: squash(entry.question), a: squash(entry.answer) }))
    .filter((entry) => entry.q && entry.a)
    .map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    }));
  return mainEntity.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity }
    : null;
}

/** Serialise JSON-LD safely for an inline <script>: "<" can never close it. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// ── Property metadata (S-04) ─────────────────────────────────────────────────

export interface PropertySeoInput {
  title: string;
  slug: string;
  summary?: string | null;
  bedrooms?: number | null;
  unitType?: string | null;
  community?: string | null;
  city?: string | null;
  /** Absolute URL of a 1200x630 social image built from the featured image. */
  imageUrl?: string | null;
}

/**
 * Title ladder: "{beds}-bed {type} in {community}, {city} | Haus of Estate",
 * dropping the brand, then the city, then falling back to the CMS title until
 * the result fits in 60 characters.
 */
export function propertyTitle(property: PropertySeoInput): string {
  const type = squash(property.unitType).toLowerCase();
  const community = squash(property.community);
  const city = squash(property.city);
  const fallback = squash(property.title);
  if (!type || !community) return truncateAtWord(fallback, TITLE_MAX);

  const beds = property.bedrooms && property.bedrooms > 0 ? `${property.bedrooms}-bed ` : "";
  const noun = `${beds}${type}`;
  const label = `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`;
  const cityRedundant = !city || community.toLowerCase().includes(city.toLowerCase());
  const place = cityRedundant ? community : `${community}, ${city}`;
  const candidates = [
    `${label} in ${place} | ${SITE_NAME}`,
    `${label} in ${place}`,
    `${label} in ${community}`,
    fallback,
  ];
  return candidates.find((candidate) => candidate.length <= TITLE_MAX) ?? truncateAtWord(fallback, TITLE_MAX);
}

export function propertyDescription(property: PropertySeoInput): string {
  const base = squash(property.summary) || `${squash(property.title)} — property introduced by ${SITE_NAME}.`;
  if (base.length >= DESCRIPTION_MIN) return truncateAtWord(base, DESCRIPTION_MAX);
  const extended = `${base} ${ENQUIRY_SUFFIX}`;
  return extended.length <= DESCRIPTION_MAX ? extended : truncateAtWord(base, DESCRIPTION_MAX);
}

/**
 * Pure metadata for /properties/[slug]. Wire it from generateMetadata:
 *   return propertyMetadata({ ...property, imageUrl: ogImage })
 * `imageUrl` is the 1200x630 crop built by the caller (urlFor(...)); omit it
 * (e.g. for concept imagery) to fall back to the branded default image.
 */
export function propertyMetadata(property: PropertySeoInput): Metadata {
  const title = propertyTitle(property);
  const description = propertyDescription(property);
  const path = `/properties/${property.slug}`;
  const images = property.imageUrl
    ? [{ url: property.imageUrl, width: 1200, height: 630, alt: squash(property.title) }]
    : DEFAULT_OG_IMAGES;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: SITE_NAME,
      locale: "en_GB",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [property.imageUrl ?? DEFAULT_OG_IMAGE],
    },
  };
}

// ── Blog metadata rules ──────────────────────────────────────────────────────

/** Posts shorter than this (words) are thin content: noindex and out of the sitemap. */
export const THIN_POST_WORDS = 400;

export function isThinPost(wordCount: number | null | undefined): boolean {
  return typeof wordCount === "number" && wordCount < THIN_POST_WORDS;
}

const BRAND_SUFFIX = /\s*[|\-–—:]\s*Haus of Estate\s*$/i;

/**
 * SEO title for a post: strip any brand the editor typed (the old
 * "… | Haus of Estate — Haus of Estate" duplicate), re-append the brand only
 * when the whole thing still fits in 60 characters, otherwise truncate.
 */
export function blogTitle(seoTitle: string | null | undefined, title: string): string {
  let base = squash(seoTitle) || squash(title);
  while (BRAND_SUFFIX.test(base)) base = base.replace(BRAND_SUFFIX, "");
  if (!base) base = squash(title);
  const withBrand = `${base} | ${SITE_NAME}`;
  return withBrand.length <= TITLE_MAX ? withBrand : truncateAtWord(base, TITLE_MAX);
}

/**
 * Meta description for a post: drop keyword-stuffing tails ("Keywords: …"),
 * then cap at 160 characters on a word boundary.
 */
export function blogDescription(seoDesc: string | null | undefined, subtitle: string | null | undefined): string {
  const raw = squash(seoDesc) || squash(subtitle);
  const stripped = squash(raw.replace(/\s*\(?\bkey\s?words?\b\s*:.*$/i, ""));
  if (!stripped) return DEFAULT_DESCRIPTION;
  if (stripped.length <= DESCRIPTION_MAX) return stripped;
  // Prefer ending on a full sentence inside the limit.
  const window = stripped.slice(0, DESCRIPTION_MAX);
  const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
  if (sentenceEnd >= DESCRIPTION_MIN) return window.slice(0, sentenceEnd + 1);
  return truncateAtWord(stripped, DESCRIPTION_MAX);
}

// ── Sitemap (S-02) ───────────────────────────────────────────────────────────

/**
 * Indexable static routes with a real, stable last-modified date (ISO). These
 * are constants on purpose: bump the date when the page content materially
 * changes. Never use `new Date()` here, or Google learns to ignore <lastmod>.
 * Excluded on purpose: /match, /auth/*, /careers (closed), /api, /studio, and
 * /properties/residential|commercial (near-duplicates of /properties).
 */
export const SITEMAP_STATIC_ROUTES: ReadonlyArray<{ path: string; lastModified: string }> = [
  { path: "/", lastModified: "2026-10-17" },
  { path: "/properties", lastModified: "2026-10-17" },
  { path: "/about", lastModified: "2026-10-17" },
  { path: "/services", lastModified: "2026-10-17" },
  { path: "/renovations", lastModified: "2026-10-17" },
  { path: "/team", lastModified: "2026-07-19" },
  { path: "/faq", lastModified: "2026-07-19" },
  { path: "/blog", lastModified: "2026-10-17" },
  { path: "/list-property", lastModified: "2026-10-17" },
  { path: "/contact", lastModified: "2026-10-17" },
  { path: "/legal/privacy-policy", lastModified: "2026-10-17" },
  { path: "/legal/terms-of-service", lastModified: "2026-10-17" },
  { path: "/legal/cookie-policy", lastModified: "2026-10-17" },
];

export interface SitemapSource {
  posts?: Array<{ slug: string; updatedAt?: string | null; publishedAt?: string | null; wordCount?: number | null }>;
  properties?: Array<{ slug: string; updatedAt?: string | null }>;
  /** Latest FAQ document _updatedAt, if known. */
  faqUpdatedAt?: string | null;
}

function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function latest(values: Array<string | null | undefined>): Date | undefined {
  const dates = values.map(toDate).filter((date): date is Date => Boolean(date));
  return dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : undefined;
}

/** Pure sitemap assembly: only indexable URLs, only real dates. */
export function buildSitemapEntries(source: SitemapSource = {}): MetadataRoute.Sitemap {
  const posts = (source.posts ?? []).filter((post) => post?.slug && !isThinPost(post.wordCount));
  const properties = (source.properties ?? []).filter((property) => property?.slug);
  const derived: Record<string, Date | undefined> = {
    "/blog": latest(posts.map((post) => post.updatedAt ?? post.publishedAt)),
    "/properties": latest(properties.map((property) => property.updatedAt)),
    "/faq": toDate(source.faqUpdatedAt),
  };

  const staticEntries = SITEMAP_STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: derived[route.path] ?? new Date(route.lastModified),
  }));
  const postEntries = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: toDate(post.updatedAt) ?? toDate(post.publishedAt),
  }));
  const propertyEntries = properties.map((property) => ({
    url: absoluteUrl(`/properties/${property.slug}`),
    lastModified: toDate(property.updatedAt),
  }));
  return [...staticEntries, ...postEntries, ...propertyEntries];
}

// ── robots.txt (S-01/S-02) ───────────────────────────────────────────────────

export const ROBOTS_DISALLOW = ["/api/", "/studio/", "/auth/"];

/**
 * robots.txt rules. `host` is omitted (a Yandex-only directive). The sitemap
 * must always be referenced. No AI-crawler policy is set here: that is a
 * business decision, so the default `*` rules apply to every bot.
 */
export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ROBOTS_DISALLOW },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
