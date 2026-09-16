# Email backlog reconciliation — 16 September 2026

Source: the supplied `pasted-text.txt` email handoff, prepared 16 September. Email
requests are evidence of requirements, not evidence of deployment or permission
to publish, send campaigns or change company services. No personal inbox was
opened during this reconciliation.

Repository inspected: `suryak02/azizi-florence-content-scaffold`, initial head
`52153317` (Release 2 / PR #12). Release ownership and the Florence pause follow
[`releases.md`](releases.md), which supersedes historical instructions to create
individual feature branches. Release 1 / PR #15 remains the technical SEO and
consented GA4/GTM release. Existing local handoffs and assets were preserved.

“Built” below means implementation exists in the inspected working tree. It does
not mean deployed, enabled, published, delivered to an inbox or written to Excel.
Status applies to the whole requested outcome; a completed code subtask can still
have an in-progress or blocked overall outcome. Owners below identify the next
decision or action, not a new commitment made on their behalf.

## Reconciliation

| ID | Status and existing implementation | Current evidence / remaining gap | Next action and missing input | Owner |
| --- | --- | --- | --- | --- |
| **H01 — property labels** | **In progress: source identified; correction not made.** Release 2 maps `completionStatus: completed-offplan` to “Completed & off-plan” in home cards, the catalogue and details. The schema also defaults new records to that value. | A fresh public CMS read found **Al Furjan** (`al-furjan`) and **Azizi Monaco Mansions** (`monaco-mansions`) with that exact value; both are featured. These are the two current discoverable properties. The screenshot's crop still does not prove its page/card identity. Their separate `availability` fields are absent. | Review these two records against Sonia's off-plan instruction and correct only the identified facts through the existing content workflow; review the misleading default. Do not relabel completed properties globally or touch Florence. Verify badges and search classification together after review. | Surya: targeted correction preparation; Sonia: factual scope; authorised editor/Deb: publication/release. |
| **H02 — Greece / Country → City** | **In progress: hierarchy built; Greece addition and inventory blocked on content.** `property-locations.ts`, the locations API, homepage selector and listing filters implement country/city selection; changing country resets city. | Public inventory currently yields only UAE → Dubai, with no Greece records. Country/city are free-text CMS fields, so supported inventory can introduce Greece without a schema enum change. The separate enquiry form still hardcodes UK/UAE/Indonesia/Cyprus/Other and omits Greece. | Add Greece consistently to enquiry choices; obtain approved Greek inventory before listing it. Decide how an empty market should appear without inventing cities or available stock. Reproduce Sonia's “property table” issue against a named page; the phrase alone identifies no defect. | Surya: UI/filter reconciliation; Sonia/Haus partner: properties, cities, facts, assets and approval. |
| **H03 — PolicyBee badge** | **Not started in inspected source/assets.** No PolicyBee reference or badge was found under `src`, `content` or `public`. | The handoff names honey/white originals in the email; those binary assets have not been established in the repository. No deployed badge was verified. | Use the supplied honey or white original in footer/FAQ with appropriate alt text, once retrieved and checked. Preserve the request's customer-only condition; do not infer cover scope. | Surya: implementation; Sonia: original asset/current badge eligibility; Deb: release. |
| **H04 — popup / shareable form / Excel** | **In progress; operational completion blocked.** Popup, `/register-interest`, UTM context, validation, idempotent lead/consent persistence and durable outbox are built. Power Automate and ZeptoMail delivery adapters exist. | Source flags gate intake/delivery. Hosted test database, running worker, actual shared inbox receipt and an Excel row have **not** been demonstrated. A direct email adapter does not write Excel. The proposed Resend adapter for durable lead delivery is still missing. Privacy Policy still contains company-number/address placeholders. | Deb/integration owner must identify isolated hosted test services, chosen sender, monitored recipient, company workbook/table and Microsoft/flow access. Sonia must settle controller/contact wording. Prove one stored lead + outbox + actual inbox receipt + exactly one Excel row, including retry, before calling it operational. | Deb: hosting/access; company Microsoft/email owner: workbook/flow/sender; Sonia: recipients/legal wording; Surya: adapter/integration and verification. |
| **H05 — five career categories** | **Code subtask complete; release outcome in progress.** Commit `550f5695`, merged into Release 2 by `5e65ba49`, uses one exact five-role manifest for index, detail routes and API gates. | Approved titles are Content Managers, Real Estate Agents, PR Interns, Videographers and Lead Generators. Fresh public CMS still has eight old open records, including Interior Design Intern; Release 2 hides/rejects them independently. Their CMS closure plan remains unapplied. Existing applications were preserved. Live deployment is unverified. | Archi/Sonia review the five categories and supply approved job briefs/terms. Deb releases the existing change; authorised CMS cleanup can close stale records by current revision without replacing documents. Do not redo this feature or equate old CMS records with current Release 2 visibility. | Archi/Sonia: descriptions and approval; Deb: release; Surya: review support. |
| **H06 — portfolio report** | **In progress: improvements built, original cause unconfirmed.** Same careers change adds clearer portfolio sharing-link instructions, CV attachment-or-link handling, trimmed URL validation and explicit provider errors. | Portfolio remains a URL field, not file upload/storage. CV limit is 4,000,000 bytes, total request 4,400,000. Resend acceptance is checked; final HR receipt and recruiter access to sharing links remain unverified. The email does not establish a failed CV upload or a file-size cause. | Reproduce a synthetic portfolio URL end to end on the hosted test target and check HR access. If diagnosing the historical incident, obtain the attempted link/error/request trace through HR without assuming the attachment size was the cause. | Surya: technical verification; Archi/HR: recruiter receipt/access and incident evidence; Deb/email owner: test sender. |
| **H07 — snagging service/campaign** | **In progress: service page built; full campaign journey incomplete.** `/snagging` includes explanations, FAQ, Fatima's guide and quote details. Navigation links exist. | Quote CTA currently opens prefilled WhatsApp/email messages, not a persisted dedicated snagging form. No separate focused campaign landing route was found. An optional booking URL/embed exists; the company calendar remains unset. Current source does not establish the promised campaign form's complete field/UTM/delivery path. | Complete the agreed campaign form/landing flow after confirming service scope, coverage, questions, quote destination, imagery and pricing process. Configure/test actual calendar separately under the later agreed booking requirements. Reconcile urgent campaign timing with the September SEO plan. | Sonia: offer/scope/rate card/coverage; Surya: form/page; Tanu: campaign; calendar owner: bookings; Deb: release. |
| **H08 — article covers** | **Four matched replacements saved as native Sanity drafts.** Snagging buyer guide and Etihad from Desire; Yas Island and Airport from Likith. Release 2 cover frames now preserve 16:9 artwork. | All four are 1920 × 1080. Published revisions remain unchanged. Likith's separate snagging-guidelines file has not been located. Seven original ratio replacements remain, plus an additional Distress Deals cover found in the current CMS. | See [cover update](blog-cover-update-2026-09-16.md) and its single visual review page. Read the missing artwork before choosing its article. Review pre-existing Airport draft body edits before publication. | Surya: implementation; Desire/Likith: supplied artwork and missing-file clarification; content approver: publication. Adifah did not work on the website and is not assigned missing work. |
| **H09 — Our Team** | **In progress: page/schema built; Sonia content pending.** `/team`, portrait and LinkedIn fields, and status-filtered queries already exist. | Fresh public CMS returned **zero published team members**. The schema's status currently defaults to `published`; it has no explicit contract-signature gate. No Sonia portrait/LinkedIn URL was established in the supplied handoff. | Obtain Sonia's approved headshot/profile URL; prepare her entry and review conservative draft defaults/publication controls. Keep Delvina Johnson, Namra Sawid, Anant Gupta and Anna Rajesh unpublished, including names, until the stated contract condition is met. | Sonia: approved assets/contract clearance; Surya: page/control preparation; authorised editor: publication. |
| **H10 — interiors** | **In progress: generic Services/Furnishing/Staging and Renovations content exists; requested team-specific update blocked on approved offer.** | Existing copy describes furnishing, staging and trades. No approved Basic/Standard/Premium package specification or pricing was established. Those email examples remain discussion topics. | Gather approved service scope, examples/vision boards, materials/labour basis, timings and outcomes from the interiors team; compare with current copy and prepare targeted changes. | Interiors team/Sonia: offer/content/approvals; Surya: site changes. |
| **H11 — Florence** | **Blocked by explicit pause; draft preparation complete.** Six native drafts and their supplied classifications/assets were previously verified, with later pricing evidence recorded in current handoffs. | Fresh public CMS read found **zero published Florence properties**. Current `releases.md` and the hosted-staging record supersede older ingestion notes saying all prices are missing. | **Leave untouched.** Await Surya's discussion with Deb/Sonia and a subsequent publication decision. Do not restart imports, relabel these records for H01 or ask again for facts already supplied. | Surya, Deb and Sonia. |
| **H12 — technical SEO / hreflang** | **Partially addressed.** Release 1 / PR #15 exists and is retained in cumulative Release 2. The original multi-tab Google audit was retrieved and mapped in [SEO verification](seo-verification-2026-09-16.md). | Six code checks pass. Audit speed targets, deployed behavior and real GA4 receipt remain unverified. Some audit fixes already predate Release 1; HTML sitemap, Meta, editorial work and real localized page pairs remain outstanding or undecided. | Use the report's requirement-by-requirement evidence. Confirm Friday 18 September meeting attendance and campaign sequencing separately; no meeting acceptance is inferred or sent. | Surya/Deb: technical/release; Shoaib/Tanu: SEO/language scope; Sonia: meeting/campaign decision. |
| **H13 — Meta/conversions** | **Blocked on access/decisions; Meta integration not complete.** Existing GTM/GA4 consent/event implementation keeps advertising tags disabled. | GA4/GTM configuration is not a Meta Pixel. Correct company Pixel/Business Suite ownership and approved event mapping are not established by this email handoff. | Tanu/company owner supplies Pixel/business access and approved non-PII conversion mapping; integrate once through the agreed consent/tag plan and prove receipt before advertising use. Use current SEO/analytics verification for exact tag evidence. | Tanu/Sonia: access and mapping; Surya: implementation; Deb: release/container ownership. |
| **H14 — news / LinkedIn / PDFs / newsletters** | **In progress: blog/editorial workflow, manual social publishing packs and separate consent capture exist. Requested complete news/PDF/delivery workflow is not built.** | No dedicated Latest News route or newsletter-PDF file/download field was found in the current post schema/routes. Ordinary body links are possible but do not supply that workflow. Social packs do not call LinkedIn APIs. Customer newsletter/provider sync, public unsubscribe/suppression and sending remain upcoming work. | Fatima/Sonia choose news structure and approval owner; define LinkedIn scope and PDF storage/download ownership. Decide provider/list ownership and recipient rules with the current email-scenario work before implementing newsletter delivery. | Fatima/Sonia: content/workflow; Tanu: social/newsletter accounts; Surya: implementation. |
| **H15 — AI sales journey** | **In progress: guarded AskHaus discovery and editable adviser brief exist; live sales journey unverified.** Read-only published-property/approved-knowledge tools and manual handoff are built behind a default-off feature check. | Current compatibility provider routes the brief into shared lead intake when enabled, superseding the old document's blanket “legacy modal only” claim. Handoff still reduces context to intent/market/area/bedrooms; it does not preserve selected property ID/slug and has limited market mappings. Hosted auth, model usage, approved inventory and actual staff delivery remain unproven. | Agree target questions/qualification and supported markets; preserve canonical selected-property context in the reviewed handoff and prove persistence/receipt. Obtain Sonia's review of the sales journey before enablement. No autonomous outreach, bookings or sales commitments are implied. | Sonia: journey/wording; Surya: handoff and verification; Deb: hosted services/access. |
| **H16 — quotation email provenance** | **Blocked: website origin unverified; no confirmed website defect.** Reviewed website notification templates use Haus lead/application subjects and structured context; no Filemail generation was found. | The handoff's forwarded Filemail message has no submission ID/property metadata. A template mismatch is not proof of fraud or proof that no website submission exists. No production lead records or shared inbox logs were accessed; external PDF was not opened. | Authorised lead/inbox owner compares sender/date/message headers with actual submissions/provider logs and reports a match or no match. Keep the conclusion “unverified” until evidence exists. | Sonia/HR and Deb's lead/inbox owner; Surya: technical correlation when scoped access is available. |

## Evidence and limits

On 16 September, around 18:55 UK time, an unauthenticated read of
`jdxbkry4 / production` through Sanity API version `2026-02-01`, explicitly using
the `published` perspective, returned:

- Two discoverable published properties: Al Furjan and Azizi Monaco Mansions;
  both featured, Dubai / United Arab Emirates, `completionStatus` set to
  `completed-offplan`, with `availability` absent. No Greece inventory appeared.
- Zero team documents with `status: published` in the published perspective.
- Eight open legacy roles: Interior Design Intern, International Markets
  Associate — Remote, Lettings Specialist — Cardiff, Property Advisor — London,
  Property Management Intern, Social Media Manager, Staging Interiors Intern
  and Video Editor. This is CMS evidence, separate from Release 2's role gates.
- Zero published property records matching Florence by title or slug. This read
  did not inspect or change its drafts.

The current deployment was not established by this reconciliation. Web-tool
requests for public careers, snagging, register-interest, team and property
routes returned a non-retryable tool safety error. That is **not an observed
website outage** and does not show which commit is deployed. The parent task's
separate live SEO inspection may supply additional production evidence.

No new tests, builds, local services, submissions, emails, bookings, migrations,
CMS mutations or deployment actions were performed by this reconciliation.
Earlier test results in career/backend handoffs remain historical evidence;
they were not rerun or promoted to proof of real delivery.

## Implementation references

- H01–H02: `src/components/landing/property-showcase.tsx`,
  `src/components/properties/property-listing.tsx`,
  `src/components/properties/PropertyDetailView.tsx`,
  `src/sanity/schemaTypes/property.ts`, `src/lib/property-locations.ts`,
  `src/app/api/property-locations/route.ts`,
  `src/components/landing/homepage-property-search.tsx`,
  `src/components/lead-eoi/lead-eoi-form.tsx`.
- H04: [`lead-delivery-rollout.md`](lead-delivery-rollout.md),
  [`hosted-staging-setup-2026-09-14.md`](hosted-staging-setup-2026-09-14.md),
  [`social-lead-links.md`](social-lead-links.md), `src/lib/lead-intake/`,
  `src/lib/lead-delivery/`, `src/app/api/leads/route.ts` and the Privacy Policy.
- H05–H06: [`careers-september-2026.md`](careers-september-2026.md),
  `content/careers-roles.json`, `src/lib/career-roles.ts`,
  `src/components/careers/application-form.tsx`, `src/lib/careers.ts`,
  `src/app/api/applications/route.ts` and `src/lib/email/resend.ts`.
- H07, H09–H11: `src/app/(main)/snagging/page.tsx`,
  [`sonia-demo-follow-ups-2026-09-14.md`](sonia-demo-follow-ups-2026-09-14.md),
  `src/app/(main)/team/page.tsx`, `src/sanity/schemaTypes/teamMember.ts`,
  `src/sanity/queries.ts`, `src/app/(main)/services/page.tsx`,
  `src/app/(main)/renovations/page.tsx`, and [`releases.md`](releases.md).
- H12–H14: [`release-1-analytics.md`](release-1-analytics.md),
  [`release-2-analytics.md`](release-2-analytics.md),
  [`sanity-editorial-workflow.md`](sanity-editorial-workflow.md),
  `src/sanity/schemaTypes/post.ts` and `src/components/blog/`.
- H15–H16: `src/components/property-assistant/handoff.ts`,
  `src/components/lead-modal/modal-context.tsx`,
  `src/lib/property-assistant/policy.ts`, `src/lib/features.ts`,
  `src/lib/lead-delivery/zeptomail.ts` and `src/lib/email/resend.ts`.

The actionable order from the email is H01's identified property records,
H02's Greece choices/inventory, H04's accurate operational answer, confirmation
of the already-built H05/H06 changes, and H03's badge. These are triaged here;
this record does not silently expand the current images, SEO and email-scenario
tasks into implementation of every backlog item.
