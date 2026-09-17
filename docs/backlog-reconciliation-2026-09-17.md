# Haus of Estate — H01–H20 reconciliation

Baseline checked 17 September 2026 at approximately 23:45 UK; updated early 18 September for Surya’s explicit urgent instruction. H05/H17 are now implemented and pushed for review on Release 1, with the closure carried into Release 2. This supersedes the earlier read-only position for those items. Sanity content, production deployment and customer sending remain unchanged.

## Current release and service position

- Ongoing development stays on `suryak02/azizi-florence-content-scaffold`. The explicit urgent exception prepared careers closure and H17 contacts on Release 1 first, then carries them into Release 2 without moving the overhaul into SEO.
- [PR #12](https://github.com/deb-pradhan/Haus-Of-Estate/pull/12) remains OPEN/DRAFT, targeting Release 1. The previous nine local commits and forward-merge `e2f456c0` are now included in the branch prepared for synchronization. The merge has parents `900a38ab` and R1 `78415374`, so R1 history is retained without importing R2 into SEO.
- [PR #15](https://github.com/deb-pradhan/Haus-Of-Estate/pull/15) remains OPEN/DRAFT, targeting main. Commit `78415374` is pushed: urgent careers takedown, approved contacts, and the existing SEO/analytics changes. Prepared for Deb’s review; not deployed.
- Main remains `4b953091`. GitHub's latest recorded successful deployment is Railway production, 20 August 2026 at 11:47 UTC, deployment `6001547651`, for that main commit. This is historical deployment evidence, not proof of present uptime or of a Release 1/2 deployment.
- A fresh request to the live careers URL failed DNS resolution from this machine. That does not establish a global outage. Localhost responses were available for inspection.
- Sanity `jdxbkry4 / production` is connected and authenticated reads work. The sibling `../studio-haus-of-estate` exists and imports the app's schema source. Current instructions keep it standalone. An older `docs/sanity-editorial-workflow.md` says to use/retain the embedded Studio as canonical; that wording is stale and must not override `AGENTS.md` and `docs/releases.md`.
- Safe local configuration inspection found intake enabled, delivery and AskHaus disabled, and no usable local database, mail-provider, Power Automate, calendar or AI credentials. This does not prove those services are absent from company production. No hosted test environment was established.
- The connected Vercel account returned no Haus project. It is not evidence about Deb's company hosting account. The Google Drive connector was also connected to a different account and returned 403 for the inventory sheet; the correct signed-in browser account successfully opened and read it.

## H01–H20

“Implemented” means code exists locally. “Draft” means saved in Sanity but not published. Test evidence states whether real external receipt was proved. Suggested owners identify the next action, not commitments made on their behalf.

| ID | Implementation / content status | Service, test and live status | Remaining work; missing input and owner | Evidence |
| --- | --- | --- | --- | --- |
| **H01 — property labels** | Al Furjan and Azizi Monaco Mansions are the two user-confirmed records. Both native drafts now say off-plan, sale, with completed-availability wording removed. | Fresh Sanity read confirms drafts corrected; published twins still say `completed-offplan`. Local published-content cards still show **Completed & off-plan**. The visible correction has therefore not been released. | Authorised content owner reviews and publishes only these corrections when instructed; Deb verifies the deployed rendering. Do not relabel genuinely completed stock. | `drafts.property-al-furjan`, `drafts.property-monaco-mansions`; `scripts/prepare-off-plan-corrections.mjs`; fresh CMS snapshot. |
| **H02 — Greece/search/table** | Country → City hierarchy exists. The old popup/register-interest country options omit Greece; new `/enquire` uses free-text country/city and can accept Greece. | Local locations API returns UAE → Dubai. Greece-filtered listing returns a valid empty state. No Greece Sanity records. No table malfunction reproduced from the unspecified report. | Surya: align country choices and reproduce the exact reported page. Sonia/partner: identify the table/page symptom and populate inventory facts. H18 has no Greek property rows to import. | `src/lib/property-locations.ts`, `src/app/api/property-locations/route.ts`, both lead forms; fresh API/page GET; H18 cells below. |
| **H03 — PolicyBee** | White badge with black outline is selected; supplied filename `policybee_badge_white.png`. No badge implementation or matching local repository/Downloads asset was found. Selection no longer needs to be asked again. | Latest email confirms Sonia will check with the provider about a verification link. No site display or verification URL proved. | Surya retrieves the already-supplied original and prepares placement; Sonia/provider supplies a link if one exists. Do not invent a URL or coverage claims. | Email “Fwd: Website - Must Add - Files attached below”, 17 Sep 08:57; source/assets search. |
| **H04 — lead popup/social/inbox/Excel** | Popup, `/register-interest`, and new **`/enquire`** exist. Enquiries/questions, campaign attribution, separate consent, idempotent persistence and staff-notification outbox are implemented. | No real hosted lead save, team receipt or Excel row demonstrated. Power Automate and ZeptoMail are alternative delivery paths; ZeptoMail alone does not update Excel. | **info@hausofestate.com plus Excel are confirmed requirements.** Company Microsoft owner supplies workbook/table and flow access. Sonia names the reply owner; Deb supplies hosted access. Surya connects/tests the selected path. H18 is not that lead workbook. | `35a5aeea`; `enquiry-form.tsx:171`; `lead-intake/persistence.ts:194,352`; `lead-delivery/runtime.ts:34`. |
| **H05 — urgent careers** | Careers index, every direct job URL and application intake are closed by code. Navigation/footer/About recruitment links, sitemap entry and careers analytics eligibility removed. Code, records and applications preserved. Exact replacement titles are documented but held unpublished until Sonia approves reopening. | R1 production build, TypeScript and four closure checks passed, including built HTTP GET/HEAD, RSC/prefetch, rejected POST and link/sitemap checks. Desktop/mobile verified locally. **Prepared in PR #15; not live.** Closure carried forward to R2. | Deb reviews/approves/deploys R1; Surya verifies public URLs afterwards and gives Sonia an accurate completion confirmation. Speak with Archi first thing in the morning. Reopening is a separate approved change. | `78415374`; `src/lib/careers-availability.ts`; `tests/careers-offline.test.mjs`; `docs/urgent-careers-closure-2026-09-18.md`. |
| **H06 — portfolio issue** | Clearer portfolio-link guidance, trimmed/validated URLs, CV-link alternative and honest email errors already implemented. | **16 careers tests passed again**, with mocked Sanity/mail. HR receipt and ability to open a submitted portfolio remain unverified. Liberty's original cause remains unknown. | Preserve fixes under H05. HR/Liberty supplies attempted link/error or trace only if historical diagnosis is still required. Surya tests with staff after the permitted intake scope and hosted sender are agreed. | `application-form.tsx:103,405,433`; `src/lib/careers.ts:40`; `src/lib/email/resend.ts:58,122`; `tests/careers.test.ts`. |
| **H07 — snagging** | Dedicated information page, FAQs and Fatima guide exist. Quote buttons prepare WhatsApp/email messages; they are not the promised persisted campaign form. Booking component supports an external calendar. | No separate complete Dubai campaign form/delivery journey or confirmed calendar booking demonstrated. Local calendar settings absent. | Surya builds the agreed quotation flow after the lead backend finish line. Sonia decides scope/coverage/quotation process and campaign timing; calendar owner supplies real availability/account. Tanu coordinates the campaign. | `snagging/page.tsx:181`; `components/snagging/booking-calendar.tsx:16`; `lib/snagging-booking.ts:18`. |
| **H08 — blog covers** | Four matched 1920×1080 covers saved on native drafts: buyer Snagging, Etihad, Airport and Yas Island. Rendering fixes exist locally. **Eight identified replacements remain**, listed below. | Fresh CMS confirms replacement draft refs; published covers preserved. Rendering corrections are retained in the cumulative Release 2 branch. Airport draft contains earlier edits needing whole-draft review. | Fatima helps identify remaining designers; Likith supplies/identifies the separate missing snagging-guidelines file before article matching. Content owner reviews/publication separately. No assignment to Adifah based on assumption. | `docs/blog-cover-update-2026-09-16.md`; `scripts/data/blog-covers-2026-09-16.json`; `3a977a04`; fresh CMS read. |
| **H09 — Our Team** | Team page/schema/query exist. Fresh Sanity read: **zero teamMember documents**, including drafts. Sonia's email authorises starting with her profile picture but supplies no separate headshot attachment. A candidate LinkedIn URL is located: `https://www.linkedin.com/in/soniabaig/`. | No Sonia team entry or approved final portrait asset established. Other four names remain unpublished. | Sonia confirms the exact portrait/profile material. Surya prepares her entry and conservative publication defaults; authorised editor publishes separately. Keep Delvina, Namra, Anant and Anna unpublished until contracts are cleared. | “Our Team - Web Page”, 15 Sep 19:40; `schemaTypes/teamMember.ts`; `team/page.tsx`; fresh CMS count. |
| **H10 — Interiors** | Generic furnishing/staging/renovation content exists. Afifa's two named PDFs have now been supplied; the earlier “awaiting proposals” status is outdated. Their proposed packages/prices are not implemented as an approved offer. | Budget/campaign email explicitly calls figures initial discussion benchmarks. Sonia replied that the team will review them, not approve them. No new offer deployed. | Sonia/interiors team approves scope, prices, exclusions, terminology and general launch versus Christmas direction. Surya then maps approved content to pages. Demo visuals must be labelled appropriately, never passed off as completed Haus projects. | `services/page.tsx:65–110`; `renovations/page.tsx`; 16/17 Sep Interiors threads; detailed proposal facts supplied in updated backlog. |
| **H11 — Florence** | **Six image-backed native drafts remain prepared and paused**, unchanged since 14 Sep. Five home-type records contain AED price ranges; the project overview is a separate sixth record. | Fresh read: no published Florence listings. Studio connection works; publication deliberately paused. | No action now. Surya/Deb/Sonia must separately decide any later publication. Do not recreate, overwrite or request already-supplied facts again. QR requirement is no longer applicable. | Fresh drafts with slugs `azizi-florence` and `azizi-florence-*`; `docs/releases.md`; `docs/florence-sanity-import-2026-09-14.md`. |
| **H12 — SEO/Google** | Release 1 retained: hostname redirect, homepage rendering/deferred work, review-link cleanup, consented GTM/GA4. Main already had several SEO foundations. R2 adds seller-page canonical/metadata and real sitemap modification dates. | **6 SEO/analytics checks and 4 sitemap tests passed again.** Mobile LCP <2.5s, TBT <200ms, deployed changes, GA4 receipt and Search Console results remain unproved. **Sonia acknowledged; awaiting account invitations and IDs.** Her 23:26 reply contains no IDs or granted-access confirmation. | Do not resend the request. Wait for actual IDs/invitations, then Surya verifies receipt and performance on comparable production builds; Deb reviews R1. Hreflang needs actual alternate pages. HTML sitemap/editorial/link audit still incomplete. Meeting 18 Sep 16:30 UK / 21:00 India remains proposed. | `docs/seo-verification-2026-09-16.md`; `tests/technical-seo.test.mjs`, `tests/analytics.test.mjs`, `src/app/sitemap.test.ts`; `4926f925`; new access email. |
| **H13 — Meta Pixel** | Analytics consent/event groundwork exists, but advertising consent remains denied and no Pixel/`fbq` implementation was found. | No company Pixel ID/access or Meta Test Events receipt established. | Tanu/company owner supplies business/Pixel access and agreed conversion scope; Surya implements the consented integration and tests real receipt. | `src/lib/analytics.ts:103,171,194`; SEO/release records. |
| **H14 — news/LinkedIn/newsletters** | Blog/editorial features, manual social packs and explicit newsletter consent storage exist. New wording says **coming soon** and acknowledges preferences only; email-entry CTAs are hidden when intake is disabled. Latest News/PDF workflow, LinkedIn API publishing and customer campaign sender remain unbuilt. | No real newsletter send, provider sync, public unsubscribe journey, subscriber totals or historic sending evidence established. | Fatima/Sonia owns publishing structure, PDFs, cadence and approval. Company marketing chooses/owns actual list/provider. Surya builds sending, preferences and opt-out integration. Mailchimp remains an option, not a connected service. | `900a38ab`; `BlogSidebar.tsx:67`; `lead-eoi-form.tsx:507`; `persistence.ts:280`; `newsletter.ts:107`; post schema. |
| **H15 — AskHaus** | Guarded discovery and editable adviser brief exist. Shared lead-intake bridge exists, but selected property ID/slug is not retained in the reduced brief. | Locally disabled; model/hosted authentication and model → lead → staff receipt unproved. Browser assistant tests use mocked responses. | Sonia approves qualification/hand-off journey; Deb supplies model/hosted service access; Surya retains canonical property context and verifies the real journey. No voice calling or autonomous outreach is included. | `property-assistant/handoff.ts:49`; `lead-modal/modal-context.tsx:160`; `api/property-assistant/route.ts:88`. |
| **H16 — Filemail quotation** | Investigation remains open. No Filemail generator found in source; known notification templates use Haus enquiry/application subjects. | No scoped production submissions or provider/inbox logs available for correlation. Template mismatch alone proves neither fraud nor absence of a related submission. | Authorised inbox/lead owner correlates original headers/date with records; Surya assists when access is available. | `lead-delivery/zeptomail.ts:61`; original handoff investigation. |
| **H17 — address/contacts** | Approved Unit A address added to footer, contact page and structured data. General WhatsApp links use +971585607033; call +44 7496 033321 retained. R2 snagging WhatsApp corrected too. | Locally verified; R1 correction pushed in PR #15, not deployed. Careers WhatsApp feature remains inaccessible, not merely repointed. | Deb releases after review; Surya verifies public contacts after deployment. No wording input missing. | `78415374`; footer/header/contact/About/not-found/WhatsApp float and layout JSON-LD; approved address: 115 City Road, Unit A, Cardiff, Wales, United Kingdom, CF24 3BP. |
| **H18 — property sheet** | **Actual workbook read successfully**, including every tab. It currently lists market headings and three developer names, with empty developer tabs. No property specifications, prices or listing rows. | Zero import-ready rows. Existing Azizi relationship can be identified, but no row-level property match or conflict can be established from absent data. Not a lead Excel workbook or publication instruction. | Sonia/inventory owner populates the existing workbook with actual listings and source materials. Surya later compares records without duplicates. Florence remains paused. | [Website Property Inventory](https://docs.google.com/spreadsheets/d/1xJn-sMduVD04VVa2sCEfIhc95_5_oOq5Vah00fGlK6Y/edit), exact cells below. |
| **H19 — receipts/personalised follow-ups** | Separate consent/withdrawal storage foundations exist. **Customer enquiry receipt, interest store, inactivity scheduler and campaign sender remain unbuilt.** On-screen acknowledgement and staff notifications are different outcomes. | No real personalised send, cancellation, provider unsubscribe sync, suppression or delivery-monitoring proof. | Sonia approves scenarios, timing and weekly cap; company chooses sender/owner. Surya builds and tests with staff. Logging in alone does not subscribe; AskHaus contributes confirmed preferences only; GA4 remains separate. | `docs/email-scenarios-handoff-2026-09-16.md`; `lead-delivery/zeptomail.ts:31`; `lead-intake/newsletter.ts:107`. |
| **H20 — hosted testing** | Deployment/worker code exists. Local frontend preview is not a hosted backend. No isolated hosted test environment verified. | No successful hosted enquiry → team → Excel → customer receipt → reply test. No Vercel review URL established for this release. | Deb/company agrees hosted provider, database, worker, access, budget and maintenance owner. Surya connects/tests one full enquiry first, then newsletter/follow-up with staff addresses and unsubscribe/cancellation. No local database required. | `docs/hosted-staging-setup-2026-09-14.md`; current safe config read; GitHub deployment evidence; connected Vercel project list. |

## Actual H18 sheet contents and CMS comparison

The workbook was read through Surya's signed-in browser after the connector account lacked permission. The source file was not edited. All four tabs are visible; the three developer tabs contain no values or formulas.

| Source tab/cells | Actual contents | Comparison / classification |
| --- | --- | --- |
| Developers on our Website, A1/A3 | Greeting and instruction that these developers should be on the website | Scope note, not a property row or publication approval. |
| Developers on our Website, A5:C5 | Dubai / Greece / Bali | Mixed city/country/island headings needing a country/city mapping later. Greece and Bali have no names or properties beneath them. |
| Developers on our Website, A6:A8 | Azizi / Imtiaz / Ellington under Dubai | Developer-only, incomplete for listing import. Existing Sanity has Azizi Developments associated with Al Furjan/Monaco and paused Florence. No Imtiaz or Ellington matches in current property records. |
| Azizi | Empty | No additional unit facts or pricing to reconcile. |
| Imtiaz | Empty | No property rows to import. |
| Ellington | Empty | No property rows to import. |

Fresh CMS inventory comprises 11 property documents representing 9 distinct listings: 2 public-eligible properties with corresponding drafts, 6 Florence native drafts, and Beaks Hill in a non-native-draft document with workflow status `draft`. No Greece, Bali/Indonesia, Imtiaz or Ellington property records were found. The sheet does not conflict with Florence's Sharjah location because it does not name Florence at all; its Dubai heading must not be applied indiscriminately to every Azizi property.

Classification: **0 ready property rows; 3 incomplete developer entries; 1 developer already represented (Azizi); 0 named property rows available for existing/conflicting matching.** This is not a claim that there are no potential conflicts in future inventory.

## H08 exact remainder

1. Wynn Al Marjan — narrow portrait cover.
2. 3 Lies Brokers Tell You About Buy-to-Let.
3. Dubai Metro Blue Line.
4. Emaar's AED 200 Billion Masterplan.
5. Escrow Accounts in Dubai Real Estate.
6. Dubai Land Department Fees.
7. Dubai Golden Visa.
8. Distress Deals — additional 3:2 cover found in current CMS.

Count correction: the original designer pack had nine ratio issues. Buyer Snagging and Etihad replace two of those. Airport and Yas Island refresh already-16:9 covers. That leaves seven original ratio issues plus Distress Deals, or eight currently identified replacements. Likith's separately mentioned snagging-guidelines file is still unlocated and is not assigned to an article by filename guess. Fatima is the next contact to identify creators, not assumed to be the designer.

## Changes and new information since the baseline

- `/enquire` implemented and tested locally (`35a5aeea`); Properties menu simplified (`48fa83de`).
- H01 corrections saved as two native Sanity drafts on 17 September; no publication (`dd4af139` records the evidence).
- Seller-page canonical/metadata and accurate sitemap modification dates fixed (`4926f925`).
- Newsletter copy now acknowledges saved preferences, makes readiness clear and prevents the disabled-intake fallback to the legacy account form (`900a38ab`).
- These previously local changes are retained with the urgent forward-merge for the existing PR #12. Release 1 remains separate and small; main and production are not changed by preparing either review branch.
- H03 badge choice is settled. H10 proposals are received, awaiting decisions rather than initial content. H17 contact details are now prepared on R1 for review, not live. H18 has now been read, not merely its sharing email.
- **H12 new reply at 23:26 UK:** Sonia says she will arrange access the next morning and update Surya. IDs and invitations were not present in that reply. Existing request to `marketing@hausofestate.com` invites `kommurisurya@gmail.com` to GTM Edit, GA4 Editor and Search Console Full access; do not resend it.
- **H05 latest instruction supersedes the baseline:** Sonia directly requested an immediate takedown. Surya explicitly authorised preparing it on R1/PR15 first and carrying it into R2. Replacement headings/titles below are held for approved reopening; no job descriptions or Career Experience contract types are invented.

Replacement headings/titles held unpublished:

- Lettings Agent: Lettings Specialist - UK Nationwide - Self Employed.
- Sales Agent: Sales Specialist - UK Nationwide - Self Employed; Real Estate Agent - UK Nationwide - Self Employed.
- Career Experience Openings: Content Writer; Video Content Creator; Graphic Designer; Content Manager; Content Strategist.

## Mailing provenance and ownership

Resend was introduced in Deb's original implementation (`d761f468`, 12 April 2026). The old default staff recipient was `admin@hausofestate.com`, configurable with `ADMIN_EMAIL`. ZeptoMail was added in our Release 2 work (`7871946e`, 14 September), and is not proof of an older connected company service. The now-confirmed lead destination is `info@hausofestate.com` plus Excel.

The old main-branch blog Subscribe form prevented submission and opened the account modal; it did not pass along the entered email or create a newsletter subscription. Release 2 has explicit consent/subscription persistence when its database is available, but no campaign sending system. Do not infer subscriber totals, historic campaigns, working inbox receipt, or absence of company accounts from the source alone.

Surya/Codex owns integration code and technical tests. Deb/infrastructure owner must identify hosting, production/test database, worker and access. The company email/Microsoft owner provides sender/domain credentials and workbook/flow access. Sonia/marketing owns content approval, audience/cadence and who replies. Those account decisions and approvals are not unfinished frontend development.

The intended personalised journey remains: a known visitor separately permits interest capture and personalised updates; confirmed browsing/saved-property preferences help select current properties/articles after inactivity; any enquiry or consent withdrawal can cancel inappropriate scheduled contact. The 48-hour delay and weekly cap are proposals. Customer receipts, staff replies, unsubscribe/preferences, provider opt-out synchronization, suppression, cancellation and monitoring all need explicit implementation/verification. GA4 is separate from this interest system.

## Recommended next small batch

1. **H05 + H17 prepared:** Deb reviews PR #15 and arranges the approved release; Surya checks public careers/job URLs, navigation and contacts afterwards. Preserve records and keep replacement roles held.
2. Retain the closure in cumulative R2; Surya speaks with Archi and obtains Sonia’s explicit reopening approval before any replacement careers content becomes public.
3. **H04/H20 next:** establish one isolated hosted enquiry journey: saved record, staff email at info, agreed Excel row, customer receipt and a reply. Newsletter/personalised staff tests follow after this works.

H01's two draft corrections can be reviewed for a separate authorised publication decision; Florence remains excluded. Do not start Interiors pricing, mass inventory imports, Pixel advertising, newsletters or autonomous outreach as part of the urgent batch.

## Outstanding email replies and decisions, separate from development

No emails or WhatsApp messages were sent. A short Deb message is supplied for Surya to send; PR descriptions were updated as requested. “Outstanding” means a reply/action supported by inspected threads or the supplied handoff, not a claim to have exhaustively searched all company correspondence.

- **H05:** reply to Sonia with the actual removal/release status; speak with Archi about the new 23:25 role wording. Do not reply “done” before public verification.
- **H04/H19/H20:** answer Sonia's “Pop up form status” honestly: page/intake/outbox code exists; delivery is unproved. Ask only for the specific lead workbook/table, Microsoft/flow access, mailbox owner and company hosted/email ownership. The destination and need for Excel are already known.
- **H02/H18:** acknowledge successful access to the inventory sheet; explain that it currently contains developer names and empty tabs. Ask the inventory owner to populate it, and identify the page/symptom meant by “property table”. Do not ask for property details as though the supplied sheet had been ignored.
- **H03:** white/black badge choice is answered; verification-link follow-up remains with Sonia/provider. Retrieve the existing asset rather than re-asking the colour preference.
- **H08:** ask Fatima who owns the eight remaining covers, and Likith for the separate guidelines asset. Four received images are already prepared as drafts.
- **H09:** confirm the exact Sonia portrait and final LinkedIn material; the other four profiles remain held for contracts.
- **H10:** acknowledge both Afifa proposals; Sonia/interiors team decides approved offer/prices and general launch versus Christmas. Package names Essential/Complete/Signature and quality tiers Essential/Standard/Premium are different from the Essential/Premium/Luxury budget tiers and need consistent final wording. Detailed fees in the updated backlog remain discussion proposals, not website prices.
- **H12:** request already sent and now acknowledged; wait for promised IDs/access, rather than sending it again. Meeting attendance/time and daily SEO/campaign sequencing still need confirmation.
- **H13:** Tanu/company owner supplies Pixel access and agrees conversions.
- **H14:** Fatima/Sonia clarifies Latest News/PDF/LinkedIn scope and actual newsletter ownership/provider/cadence.
- **H06/H16:** HR/authorised inbox owner supplies incident evidence for portfolio diagnosis and Filemail correlation if investigation proceeds.
- **H11:** no repeated Florence request or publication chase while paused.

## Verification and source limits

Fresh checks in the original 17 September reconciliation: branch/status/PR/deployment reads; actual inventory workbook values and formulas; scoped Gmail source messages; authenticated Sanity documents/drafts; safe config-presence checks; local careers/direct-role and property/location responses; six SEO/analytics checks, sixteen careers tests and four sitemap tests passed.

Previously recorded, not rerun here: 68 targeted backend tests, TypeScript/focused lint/production build and desktop/mobile enquiry/menu walkthroughs. Careers, lead, assistant, mail-transport and analytics test doubles are not proof of live providers. No hosted lead, customer/HR email, Excel row, newsletter, booking, real model response or Google/Meta receipt was created in this review. No new schema change or validation claim is made. The proposal detail comes from the user's supplied summary; the email/attachment presence and review status were checked, but the PDFs were not independently re-extracted in this pass.

Local private evidence snapshots: `.git/sanity-reconciliation-2026-09-17.json` and `.git/inventory-sheet-read-2026-09-17.json`. Historical comparison records remain under `.git/off-plan-corrections-2026-09-17/` and `.git/blog-cover-update-2026-09-16/`. No credential values or customer records are included here.

Relevant email sources:

- [H05 urgent careers thread](https://mail.google.com/mail/u/0/#all/FMfcgzQhWTrDKnLSLwNggvmMPbDTKXNt).
- [H12 Google access request and new reply](https://mail.google.com/mail/u/0/#all/FMfcgzQhWTrDBNXRPdCwbbHfXwQMwchL).
- [H03 badge choice/provider follow-up](https://mail.google.com/mail/u/0/#all/FMfcgzQhWTnlrwRBlKPrhrbTsqGrDKdM).
- [H10 pricing/campaign proposal](https://mail.google.com/mail/u/0/#all/FMfcgzQhWTptRZLBHRCXRbfTSvCspQCT).
- [H09 team request](https://mail.google.com/mail/u/0/#all/FMfcgzQhWTnkwJJhfKlCSpqQbHLbmjPB).

## 18 September verification update

- R1 `78415374`: production build/TypeScript passed; six SEO/analytics checks and all four closure checks passed with the local HTTP suite enabled. Desktop/mobile menus, contacts and direct job closure checked. R1 retains one baseline lint error and five baseline warnings in preserved careers pages.
- R2 merge `e2f456c0`: production build/TypeScript and changed-file lint passed; 21 careers/closure/sitemap tests, five auth/saved regression tests, six SEO checks and all four built closure checks passed. Account/messages/viewings still redirect to login correctly. Desktop/mobile checks confirm closure and retained newer navigation.
- These are local production-build tests, not production deployment, GA4 receipt, CMS publication or email delivery. After Deb’s approved deployment, check the actual public careers/job URLs and contacts before telling Sonia it is live.

## Concise handoff to paste into ChatGPT

Codex reconciled H01–H20 on 17 September, then implemented the explicitly requested urgent H05/H17 update on 18 September. PR15 now contains commit 78415374: careers/job URLs and application intake closed, recruitment links removed, Unit A address and Dubai WhatsApp corrected. It is prepared for review, not live. Sanity publication and customer sends remain unchanged.

Release 2 remains `suryak02/azizi-florence-content-scaffold` / PR12 and retains its cumulative work plus the forward-merged careers hold. PR15 stays Deb’s first review/deployment. Main remains 4b953091; neither release is deployed by this work.

- H01: Al Furjan and Monaco off-plan corrections are saved drafts; published labels remain wrong.
- H02: country/city works; Greece has no records and is missing from the old popup options. New /enquire accepts free-text Greece. Unspecified table defect not reproduced.
- H03: white/black PolicyBee selected, not implemented; verification link pending provider.
- H04: popup and /enquire built; real save/email/Excel unproved. info@hausofestate.com + Excel are confirmed. Need workbook/table, Microsoft flow and hosted/email access.
- H05: closure prepared and pushed on R1/PR15, carried into R2. Index/direct job URLs and old application submissions blocked; nav/footer/About recruitment removed. Code/records/applications preserved. Replacement headings/titles held until Sonia approves reopening. Deb release and public verification still required; Surya speaks with Archi in the morning.
- H06: portfolio fixes retained, 16 mocked tests pass; Liberty's actual failure unknown.
- H07: snagging page/FAQs/guide built; persisted campaign form, delivery and real calendar still pending.
- H08: four cover drafts verified, published versions preserved. Eight remaining: Wynn, 3 Lies, Metro, Emaar masterplan, Escrow, DLD fees, Golden Visa, Distress Deals. Separate Likith guidelines file unlocated; Fatima identifies designers.
- H09: no team records; Sonia LinkedIn candidate located, final portrait not established. Other four profiles held for contracts.
- H10: Afifa proposals received, still unapproved. Sonia decides scope/pricing and general launch versus Christmas. Do not publish proposal prices or label demo visuals as completed projects.
- H11: six image-backed Florence drafts unchanged and paused. No publication.
- H12: SEO/analytics code checks pass; mobile LCP <2.5s, TBT <200ms, real GA4 receipt and live SEO remain unproved. Sonia acknowledged; awaiting company GTM container ID/Edit, GA4 Measurement ID/Editor and Search Console Full invitations for kommurisurya@gmail.com. Do not resend the request. Meeting remains proposed; hreflang needs actual alternate URLs.
- H13: Meta disabled/unconnected; Tanu/company access and event agreement needed.
- H14: newsletter consent storage exists, sending/unsubscribe/provider sync do not. UI now says coming soon. Latest News/PDF/LinkedIn scope still unresolved.
- H15: AskHaus built but locally disabled; selected property context and real handoff verification remain.
- H16: Filemail origin unverified; needs authorised submission/inbox-log correlation.
- H17: full Unit A office address and business WhatsApp +971585607033 implemented for review; UK calling number +44 7496 033321 retained. Not live. Careers WhatsApp feature stays inaccessible.
- H18: sheet ACTUALLY READ. It has Dubai/Greece/Bali headings, Azizi/Imtiaz/Ellington names under Dubai, and three empty developer tabs. Zero import-ready property rows; not the lead Excel destination.
- H19: customer enquiry receipts, consented interest store, inactivity scheduler and campaign delivery remain unbuilt. 48 hours/weekly cap proposed, not approved. Include opt-out sync, suppression, cancellation and monitoring; GA4 is separate.
- H20: isolated hosted test backend not established. First prove one enquiry saved → info inbox → agreed Excel → customer receipt → reply, then staff-only newsletter/personalised tests with unsubscribe/cancellation.

Next small batch: Deb reviews/releases urgent PR15, then Surya verifies public URLs and confirms to Sonia. Keep closure in R2. Next development finish line is H04/H20 one hosted enquiry → info inbox → agreed Excel → customer receipt → reply. Company access/content decisions stay with named owners. No main push/merge, production deployment, content publication or customer campaign was performed.
