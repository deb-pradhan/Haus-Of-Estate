import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy (enforced).
 *
 * Next.js App Router emits inline bootstrap/RSC scripts and the site ships
 * JSON-LD blocks, so `script-src` needs 'unsafe-inline' until a nonce pipeline
 * is added in src/proxy.ts. Everything else is pinned to known hosts:
 *  - GA4 / GTM are injected after consent from googletagmanager.com
 *    (src/lib/analytics.ts) and report to *.google-analytics.com.
 *  - Sanity images/API: cdn.sanity.io, *.sanity.io (the Studio at /studio is
 *    exempt from this policy, see `headers()` below).
 *  - Property videos are YouTube/Vimeo iframes (src/lib/embed-video.ts).
 *  - Google sign-in is a server redirect; `form-action` must allow it because
 *    browsers also check the target of a form POST's redirect.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io https://images.unsplash.com https://www.googletagmanager.com https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.sanity.io https://*.apicdn.sanity.io${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
  "media-src 'self' https://cdn.sanity.io",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Headers that are safe everywhere, including the Sanity Studio.
const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
  },
  // No `preload`: submit to hstspreload.org deliberately once all subdomains are HTTPS-only.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Applied to everything except /studio (Sanity Studio needs eval, inline
// workers, many *.sanity.io origins, and may be framed by Presentation tools).
const appOnlyHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
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
  async headers() {
    return [
      { source: "/:path*", headers: baseSecurityHeaders },
      { source: "/:path((?!studio(?:/|$)).*)", headers: appOnlyHeaders },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Sanity/Unsplash assets are immutable per URL; cache optimised variants for a day.
    minimumCacheTTL: 86_400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
