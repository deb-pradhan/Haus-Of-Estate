# Returned blog covers — 16 September 2026

Four designer originals were visually checked, matched to existing articles,
uploaded to Sanity `jdxbkry4 / production`, and attached to native drafts.
Published post revisions remain unchanged. Florence was not touched.

Review all four in [the single artwork review page](../artifacts/blog-cover-review-2026-09-16.html).
Original Downloads files remain in place. No extra designer ZIP was created.

| Designer / local filename | Article | Outcome |
| --- | --- | --- |
| Desire / Snagging.jpg | Snag It Before You Sign It — The UAE Buyer’s Guide to Snagging | Native draft saved; [replacement image](https://cdn.sanity.io/images/jdxbkry4/production/7419705276ad12623ce38303ab5412c89a302237-1920x1080.jpg) |
| Desire / Etihad Rail Corridor.jpg | The Etihad Rail Corridor — The Ultimate Planning & Execution Guide | Native draft saved; [replacement image](https://cdn.sanity.io/images/jdxbkry4/production/c994eaf46b2f4b11eed84666e629273bc9197917-1920x1080.jpg) |
| Likith / air port.jpg | With the Al Maktoum Airport, why Dubai South & Emaar South real estate jumped 15%? | Native draft saved; [replacement image](https://cdn.sanity.io/images/jdxbkry4/production/e1c4bd8bc9849f26fbdd2b0b1767100040f81d23-1920x1080.jpg) |
| Likith / yas island.jpg | Disney in the Middle East: Inside the New Yas Island Theme Park | Native draft saved; [replacement image](https://cdn.sanity.io/images/jdxbkry4/production/60fe597f2914086136596f981b36397257eaf09d-1920x1080.jpg) |

Desire's “Property Snagging” artwork matches the existing buyer-guide cover.
Likith's separate snagging-guidelines artwork has not been located, so the
“DIY vs. Professional Snagging” article was not changed by filename guesswork.
Yas Island's text explicitly names Disney's first Middle East park; Airport
contains an architectural terminal illustration without a title and is matched
using the supplied designer context and the existing Al Maktoum article.

All four originals are **1920 × 1080 JPEG (16:9)**. No image was cropped,
redrawn or recompressed before uploading. Their SHA-256 hashes and target IDs
are recorded in `scripts/data/blog-covers-2026-09-16.json`.

## Outstanding cover replacements

Two of the original nine ratio issues have replacements prepared: the snagging
buyer guide and Etihad. Airport and Yas Island are additional refreshes of
existing 16:9 covers, so they do not close two more of the original nine.

- Wynn Al Marjan — the narrow portrait cover
- 3 Lies Brokers Tell You About Buy-to-Let
- Dubai Metro Blue Line
- Emaar’s AED 200 Billion Masterplan
- Escrow Accounts in Dubai Real Estate
- Dubai Land Department Fees
- Dubai Golden Visa
- Distress Deals — additional 1536 × 1024 cover found in the current CMS

The first seven are outstanding from the original nine. Distress Deals is an
additional 3:2 cover found in the current CMS read. Generic fallback covers and
near-16:9 images are separate, lower-priority artwork decisions. Adifah is not
assigned an outstanding task based on assumptions.

Update, 17 September: Desire asked Surya to contact **Fatima**, who may know
which designers created the remaining covers. Fatima is the next contact for
identifying those owners; she is not assumed to be the designer herself.
Desire and Likith remain the sources of the received artwork. The requirement
remains full-bleed 1920 × 1080 (16:9), with no white padding.

## Website changes and verification

- Article hero: 16:9 at mobile and desktop, preserving the full artwork.
- Compact related article card: 96 × 54 rather than a square thumbnail.
- Saved article: full uncropped image, 16:9 frame, no hover zoom cropping.
- Existing main/featured cards already used 16:9 containment.
- TypeScript and focused ESLint passed; no full production build or browser
  walkthrough was run for these small rendering changes.
- Sanity read-back verified all four draft asset references, unchanged published
  revisions, and unchanged other draft fields.
- Hosted/in-app draft preview still needs the configured read-only Sanity
  tokens; this review page is an artwork review, not proof of that connection.

Preparation script: `scripts/prepare-blog-cover-drafts.mjs`, read-only unless
`HAUS_BLOG_COVER_EXECUTE=true`. It requires reviewed files/hashes, checks the old
cover, uses revision guards for existing drafts, and refuses to overwrite its
original backup. Do not rerun the write mode blindly.

Local before/after records and receipts:
`.git/blog-cover-update-2026-09-16/`.
The Airport post already had a draft; all those earlier draft fields were
preserved. Review the complete draft before any publication decision.
Publication remains separate under the standing release instructions in
`AGENTS.md`.
