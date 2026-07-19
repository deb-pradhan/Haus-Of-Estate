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
