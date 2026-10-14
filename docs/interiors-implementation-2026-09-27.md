# Interiors and carousel follow-up — 27 September 2026

Prepared in Release 2 on `suryak02/azizi-florence-content-scaffold` for draft PR #16. Surya asked to proceed with implementation after the interiors source review. Production deployment and hosted intake activation remain separate release actions.

## Carousel revision

- Reduced section padding and heading spacing; logo cards are 80px high on small screens and 96px above the small breakpoint, plus their borders.
- Pointer hover pauses only inside the logo strip. Hovering over the heading, description or section padding leaves autoplay running.
- Default travel is 68.8 CSS pixels per second, matching the reviews' measured 2,064px loop over 30 seconds. Dragging, bounded release momentum, keyboard focus pause and reduced-motion presentation remain available.
- The approved dirham alignment is unchanged.

## Interiors implementation

The existing `/renovations` route becomes **Interiors & Renovations**. It incorporates the [reviewed emails and PDFs](interior-design-email-review-2026-09-25.md) as enquiry-led content:

| Supplied idea | Website treatment |
| --- | --- |
| Afifa: room-led planning and existing/empty-property needs | Goal and room choices help visitors describe a refresh, renovation, furnishing or lighting project. |
| Georgia: Design / Renovate / Furnish / Finish | Four service groups explain the kinds of help visitors can discuss, with links from the service overview. |
| Afifa and Georgia: a clear client journey | A consultation, design, works-planning and finishing sequence describes how to scope a project. |
| Nondita: distinct lighting design and an interactive lighting idea | A lighting-design section and illustrative preview distinguish lighting atmosphere from electrical installation. |
| Team: richer enquiry brief | Allowlisted goal/room selections carry into the existing enquiry route. Optional property type and approximate budget join the existing `contact.message` as labelled text. |

Only predefined service, goal and room identifiers appear in enquiry links. Budget, contact details and free text are not added to links or analytics. The existing durable lead endpoint, receipt validation and separate marketing consent remain in use; no database migration or new endpoint is needed.

With intake disabled, the interiors page offers an email link with the selected goal/room and explicitly says it opens the visitor's email app. It does not collect personal details or claim that a message was submitted. Hosted persistence and actual inbox/Sheet receipt are still unverified.

Plumbing and electrical wiring/installation remain on `/maintenance`. Unconfirmed prices, tiered packages, geographic coverage, turnaround promises and completed-project imagery are not represented as established facts. The source proposals are sufficient for this page structure; before/after case studies still need actual project assets.

## Verification

- 39 focused tests passed across carousel motion, interiors URL/message handling, form defaults, readiness, the existing lead contract and receipt validation. Scoped ESLint passed for all changed application files.
- The production build, including TypeScript, passed using the existing isolated lead-browser harness. It built with intake disabled and started with test-only readiness, an unusable loopback database and no mail/Sheet credentials.
- Desktop carousel checks confirmed that heading hover keeps motion running, logo-strip hover stops it, and dragging/release still work. The reviews' measured half-track is 2,064px over 30 seconds. Mobile checks at 390px confirmed all ten logos load, dragging works and the page does not overflow.
- Desktop/mobile interiors checks exercised room/goal selection, email draft contents, separate Maintenance links and the lighting-layer controls, including keyboard activation. Disabled intake rendered no personal-information form; the email link was inspected without sending.
- In the isolated production preview, choosing a kitchen renovation carried both choices into `/enquire`; property type and budget started blank. Empty submission displayed required-field errors. A synthetic submission against the deliberately unavailable database showed failure rather than success and retained the complete brief, budget and contact details. Newsletter consent remained unchecked and the URL contained no private brief fields. No real email, Sheet write or production submission occurred.
- Mobile checks at 390px found no horizontal page overflow in the interiors page or enabled enquiry form. Temporary viewport overrides were reset and the isolated test server was stopped.

These checks do not establish hosted delivery, inbox/Sheet receipt or GA4 collection. The normal local preview still has online intake disabled.
