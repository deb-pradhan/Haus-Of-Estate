import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import nextConfig from "../next.config.ts";

test("www requests permanently redirect to the canonical host", async () => {
  assert.equal(typeof nextConfig.redirects, "function");

  const redirects = await nextConfig.redirects();
  assert.deepEqual(redirects, [
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.hausofestate.com" }],
      destination: "https://hausofestate.com/:path*",
      permanent: true,
    },
  ]);
});

test("unapproved public review-platform links stay hidden", async () => {
  const reviewsSource = await readFile(
    new URL(
      "../src/components/landing/reviews-carousel.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(reviewsSource, /trustpilot/i);
  assert.doesNotMatch(reviewsSource, /google\.com\/search/i);
  assert.doesNotMatch(reviewsSource, /reviews on google/i);
});
