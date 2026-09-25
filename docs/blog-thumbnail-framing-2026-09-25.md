# Blog thumbnail framing — 25 September 2026

`BlogCard` (regular and compact) and `FeaturedPost` now fill their existing 16:9
frames with `object-cover`. The previous containment produced visible gutters
around non-16:9 originals. The full article hero remains uncropped with
`object-contain`, so readers can see the complete artwork.

Visual review of the ten current published non-16:9 covers found five whose upper
titles or logos need top alignment: Wynn Al Marjan, Golden Visa, Escrow Accounts,
Distress Deals and 3 Lies Brokers Tell You. `src/lib/blog-thumbnail.ts` matches
their exact current Sanity asset filenames. Future replacements, including 16:9
artwork for the same articles, automatically use normal centred framing. The
remaining inspected photographs, Etihad and Snagging covers use centred crops.

The portrait Wynn cover remains a content limitation: top alignment preserves its
title and Haus logo, but a full-width 16:9 thumbnail necessarily crops much of the
lower scene. It still needs the outstanding landscape artwork; CSS cannot turn
the original portrait into a complete landscape image. No blur, padding, or
synthetic extension has been added.

## Fresh read-only CMS evidence

An authenticated read on 25 September inspected 35 post documents in
`jdxbkry4 / production`, including native drafts. Ten published covers have a
materially different aspect ratio from 16:9. All four supplied replacements remain
attached to native drafts and have not replaced their published assets:

| Article | Published image | Native draft replacement |
| --- | --- | --- |
| Snagging buyer guide | 1920 × 1280, original `7cf7531b…` | 1920 × 1080, `74197052…` |
| Etihad Rail Corridor | 1920 × 1280, original `c958378a…` | 1920 × 1080, `c994eaf4…` |
| Al Maktoum Airport | 2240 × 1260, original `5d9201b2…` | 1920 × 1080, `e1c4bd8b…` |
| Yas Island | 2240 × 1260, original `7e9756fc…` | 1920 × 1080, `60fe597f…` |

The eight outstanding replacement artworks and Airport's pre-existing draft edits
remain documented in `blog-cover-update-2026-09-16.md`. This change does not publish
any draft or alter any Sanity record. Historical references to card containment in
that September 16 document describe the earlier implementation and are superseded
by this thumbnail-only change.

Private inspection evidence is under `.git/partner-logo-sources/`:
`blog-cover-state-2026-09-25.json`, `thumbnail-fit-comparison.png` and
`all-legacy-covers-center.png`. These are review aids, not public assets.
