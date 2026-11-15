// Shared SEO constants. The default social share image is generated from the
// App Router file convention at src/app/opengraph-image.png (served at
// /opengraph-image.png). Pages that define their own `openGraph` object must
// reference it explicitly, because Next.js only auto-applies the file
// convention to segments that do not define `openGraph.images`.
export const DEFAULT_OG_IMAGE = "/opengraph-image.png";

export const DEFAULT_OG_IMAGES = [
  {
    url: DEFAULT_OG_IMAGE,
    width: 1200,
    height: 630,
    alt: "Haus of Estate — property, with proof.",
  },
];

/**
 * BreadcrumbList structured data. Pass the same trail the page shows, in order;
 * every item needs the path of the page it names, including the current one.
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[], origin = "https://hausofestate.com") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, origin).toString(),
    })),
  };
}

/** Serialise structured data for an inline script without letting content close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

