// These legacy covers have titles or logos near their top edge. Match the exact
// asset, so a future replacement for the same article uses normal framing.
const TOP_ALIGNED_ASSETS = new Set([
  "2b6588fc2082791b334c039e7bb914ba868a0cd7-821x957.png", // Wynn Al Marjan
  "78f02b77572f0bcc951bae2cf1aaca2c5d2063ad-1379x920.jpg", // Golden Visa
  "6c4d237acf5058d075f1f3a18dcdb1c09ac2818f-1535x1024.png", // Escrow
  "a8caf01228f38bac61bc222fff7541a928aaaae4-1536x1024.png", // Distress Deals
  "36f7ad14737705ada177cf24cf20a66bb42a20f0-5422x3615.jpg", // Buy-to-let
]);

export function blogThumbnailPosition(imageUrl: string): "center top" | "center" {
  try {
    const url = new URL(imageUrl);
    const asset = url.pathname.split("/").at(-1) ?? "";
    if (url.hostname === "cdn.sanity.io" && TOP_ALIGNED_ASSETS.has(asset)) {
      return "center top";
    }
  } catch {
    // Local/fallback images retain the normal centred crop.
  }
  return "center";
}
