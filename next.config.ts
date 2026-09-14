import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep browser-test builds separate from the local development server.
  distDir: process.env.HAUS_NEXT_DIST_DIR || ".next",
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.hausofestate.com" }],
        destination: "https://hausofestate.com/:path*",
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
