import assert from "node:assert/strict";
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
