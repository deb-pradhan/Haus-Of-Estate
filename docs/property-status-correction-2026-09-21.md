# H01 — published property status correction, 21 September 2026

Surya directly requested removing the misleading completed status from the
Azizi Monaco Mansions and Al Furjan listings. The earlier 17 September change
had only prepared native drafts; the published documents still carried the
incorrect wording. This request authorises the narrow public correction below,
separately from Release 2 preparation and all other content holds.

## Applied correction

At **10:04:59 UTC on 21 September**, Sanity project `jdxbkry4`, dataset
`production`, transaction `4tPv1iuVIKpNRsIVnGZ3xO` updated exactly:

- `property-al-furjan`, slug `al-furjan`.
- `property-monaco-mansions`, slug `monaco-mansions`.

Both now use `completionStatus: off-plan`, `availability: [off-plan]` and
`listingType: [sale]`. Their summaries say “Off-plan options” and “Off-plan
availability” respectively. The Al Furjan description's “completed and off-plan
apartments” is corrected to “off-plan apartments”. No new completion date or
availability guarantee was invented.

The correction patches these fields from each published record's own current
content under revision checks. It does not publish or copy an entire draft.
Both existing native drafts were already correct and retain their exact prior
revisions. Full read-back confirms every unrelated field on the two published
records is unchanged, and **44 other property/blog document revisions remain
unchanged**, including Florence, Cardiff and the saved cover replacements.

The narrowly scoped, read-only-by-default script is
[`scripts/correct-published-off-plan-status.mjs`](../scripts/correct-published-off-plan-status.mjs).
It is a recorded one-time correction, not part of application startup or
deployment. An explicit execute environment flag is required for writes. It
backs up the current records, uses one revision-guarded transaction, disables
automatic mutation retries and verifies the result. A repeated execution with
the now-correct records has no changes to apply.

Private local receipt: `.git/off-plan-public-correction-2026-09-21/` contains
`before.json`, `plan.json`, `mutation.json` and `after.json`. No credentials are
logged or stored in this document. Focused script lint passes.

## Public verification

Before the correction, live listing, homepage cards and both details showed
“Completed & off-plan” at 10:03:56–57 UTC. The public listing already showed
both cards as **Off-plan / For sale**, with corrected summaries, at 10:05:14 UTC.
The homepage and detail pages returned their older cached versions on that
first post-write request; their configured revalidation interval is 60 seconds.
Normal public URLs were checked again at **10:06:25 UTC** after regeneration:

| Public URL | Confirmed returned HTML |
| --- | --- |
| `https://hausofestate.com/properties` | Both cards Off-plan / For sale; corrected summaries. |
| `https://hausofestate.com/` | Both featured cards Off-plan / For sale; corrected summaries. |
| `https://hausofestate.com/properties/al-furjan` | Apartment · Off-plan; completed-apartment wording removed from body and summary. |
| `https://hausofestate.com/properties/monaco-mansions` | Mansion · Off-plan; corrected summary. |

All four responses were HTTP 200. Both detail pages' standard description,
Open Graph description and Twitter description also contain the corrected
summaries. Other uses of “completed”, such as an unrelated homepage testimonial
about a purchase, were deliberately unchanged. No global label substitution was
made. Homepage/detail ETags changed; cache headers alone were not treated as
proof—the returned content was inspected. Evidence files are
`.git/h01-live-before-2026-09-21.json` and `.git/h01-live-after-2026-09-21.json`.

HTTP checks use ordinary public GET requests. Local DNS failed, so the checker
resolved the current public IP using Google DNS and used `curl --resolve`,
preserving the original HTTPS host and TLS certificate validation. No cache,
DNS or hosting settings were changed.

This is a live CMS content correction. No main-branch push, application
deployment, Florence/Cardiff/blog publication or customer send was required.
