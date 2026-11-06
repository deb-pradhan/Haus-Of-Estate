import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep browser-test builds separate from the local development server.
  distDir: process.env.HAUS_NEXT_DIST_DIR || ".next",
  // Railway's Docker image runs the standalone server. Vercel builds its own
  // output and its post-build step expects the default trace files, so the
  // standalone mode is skipped there (Vercel sets VERCEL=1 at build time).
  output: process.env.VERCEL ? undefined : "standalone",
  async headers() {
    return [
      {
        // The fixture showcase is a review preview: never indexed, never cached by shared caches.
        source: "/showcase/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/showcase",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.hausofestate.com" }],
        destination: "https://hausofestate.com/:path*",
        permanent: true,
      },
      {
        source: "/ask",
        destination: "/enquire",
        permanent: false,
      },
      {
        // Search Console still discovers the site's former cookie policy URL.
        source: "/cookie-policy",
        destination: "/legal/cookie-policy",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
