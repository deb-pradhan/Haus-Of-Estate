# Website update — 22 September 2026

This report separates prepared website changes, verified account settings and
remaining delivery work. Website changes are on the existing Release 2 branch,
`suryak02/azizi-florence-content-scaffold`, for review in
[draft PR #16](https://github.com/deb-pradhan/Haus-Of-Estate/pull/16). They have not
been deployed to production by this task. Release 1 / PR #15 remains the merged
18 September release; its retired SEO branch must not be recreated.

## Prepared website changes

| Work | Result prepared in Release 2 | Evidence and limits |
| --- | --- | --- |
| Registration claims and company identity | Removed Rent Smart Wales and Propertymark registration claims from the footer and their other current website placements. RERA was already absent and has not been reintroduced. Added the verified Companies House number **17188168** and legal name **HAUS OF ESTATE LTD** in shared company identity, footer and legal pages. | `src/lib/company-identity.ts`, footer, homepage, Services, Renovations, privacy and terms pages. [Companies House record](https://find-and-update.company-information.service.gov.uk/company/17188168) is active. Registration does not establish membership of the removed schemes. Address discrepancy remains below. |
| Blog bylines | Public article cards, featured articles, author presentation and article structured data credit **Haus of Estate**. | Blog components and `src/app/(main)/blog/[slug]/page.tsx`. Original Sanity author records and editorial history are preserved; no author documents were deleted or published. |
| Meet the team | `/team` presents Sonia Baig as Founder with the approved portrait, biography, LinkedIn and Instagram links, plus Person structured data. Instagram and full-biography support are added to the existing team schema/view. | `src/lib/team.ts`, `public/team/sonia-baig.jpg`, team page/components/schema. Source: Sonia's 22 September photos email `1a0c8cefc4b1cac5`, exact attachment **Sonia white SHIRT + beige suit.jpg**, original 5000 × 5000. Approved links: [LinkedIn](https://www.linkedin.com/in/soniabaig/) and [Instagram](https://www.instagram.com/soniabaig/). Only Sonia is enabled; the other profiles remain held. No team CMS publication was performed. |
| Careers reopening | Reopened the index and the **nine approved replacement role URLs**, including **Social Media Account Manager (Intern)**, with the exact supplied titles and known terms. Historical and unknown job URLs remain unavailable. | `content/careers-roles.json`, shared role resolver, careers pages and proxy. Sonia's 22 September request supersedes the earlier browsing closure for this reviewed list. Unprovided descriptions, pay, hours and duration are not invented. |
| Application intake | Kept application submission behind a separate server setting, disabled by default, while allowing the approved careers pages to be browsed. Reused the existing endpoint and CV/link validation. | `CAREERS_INTAKE_ENABLED`, `src/lib/careers-settings.ts`, application API/form. Application delivery is **not verified or enabled by reopening the pages**. Displayed and actual recipients share `CAREERS_EMAIL`, with `hr@hausofestate.com` as the fallback. |
| Mortgage / EMI calculator | Added `/mortgage-calculator`: blank loan, annual rate and term inputs; estimated monthly repayment, total repayment and interest; GBP/AED/USD amount labels with no conversion. Sale-property pages link to it. | Calculator library/component/page and tests. Zero and very small rates are handled; invalid values receive accessible errors. It is a fixed-rate illustration excluding taxes, fees and insurance, not a quotation or affordability decision. Property valuation remains parked. |
| HTML and XML sitemaps | Added `/sitemap`; both formats share public page links, published article/property titles and approved role resolution. | `src/lib/public-sitemap.ts`, both sitemap routes/tests. Explicit published Sanity perspective excludes held drafts and release versions; private routes are omitted. XML retains real content revision dates. Lead pages remain conditional on their existing availability flag. No new Search Console submission was made. |
| Measurement route coverage | Extended the existing consented allowlist to the calculator, sitemap, careers index and only the nine approved role paths. | `src/lib/analytics.ts`, `tests/analytics.test.mjs`. Retired/unknown jobs, private pages and preview routes remain excluded. Calculator figures, applicant details and query/fragment values are not collected; no new calculation or application event was added. This does not connect the missing GTM container. |

## Google and service evidence checked today

The signed-in checks below were made on **22 September, approximately
20:40–20:50 UK time**, using Surya's account. Surya's Gmail access worked during
this review; the earlier account-switch problem did not prevent reading the
relevant website correspondence in this session.

| Service | Verified state | Next action and owner |
| --- | --- | --- |
| GA4 | Property **550966592**, stream **15476606535**, measurement ID **G-FEZF22MELJ**. The UI still reports no data in the last 48 hours. Enhanced measurement and Google Signals were already **off**. | **Surya + Deb/company analytics owner:** connect the intended container and prove consented events in DebugView/Realtime on the correct deployment. Do not add a second unconditional tracker. |
| GA4 ads personalisation | The control initially allowed **307/307**. Under the authorised consent setup, it was changed, saved and confirmed as **0/307 allowed** at approximately **20:48 UK**. | This is the only saved Google configuration change in this task. Keep it consistent with the application's denied advertising consent. It is not proof of event collection. |
| Google Tag Manager / Google tag | Surya's GTM account list remains empty, and the interface shows no Google tags for this account. The user's screenshot identifies Google tag **GT-55K83XLJ** linked to measurement ID **G-FEZF22MELJ**. | **Deb/company container owner:** provide the existing **GTM-… container ID** and appropriate access. **GT-…**, **G-…** and **GTM-…** are different identifiers; neither supplied ID fills `NEXT_PUBLIC_GTM_ID`. Do not infer that the company has no container from Surya's empty list. |
| Public tracking implementation | At **19:55 UK**, read-only HTTP checks of `/`, `/about` and `/contact` returned `gtmId: undefined`; the 18 homepage client bundles contained the existing consent-managed loader, with no configured container ID or direct GA loader. | **Deb:** reconcile the reported push to main with the actually served build and environment. **Surya:** repeat the browser/network and real-receipt checks once configured. This does not disprove Deb's report of a push; repository, deployment, configuration and receipt are separate evidence. |
| Search Console sitemap | Existing `https://www.hausofestate.com/sitemap.xml` shows **Success**, **34 discovered pages**, last read **18 September**. | **Surya:** verify current canonical coverage after the intended release. Existing access/submission need not be recreated. |
| Search Console indexing | Pages report, last updated **18 September**: **49 indexed**, **22 not indexed**. Breakdown: 7 alternate pages with proper canonical, 3 not found, 3 redirects, 6 crawled but not indexed, 3 discovered but not indexed; duplicate category **0**. | **Surya + Shoaib:** inspect the affected URLs and distinguish expected exclusions from real faults before changing redirects, canonicals or content. This is a dated report snapshot, not today's crawl or a sitewide pass. |
| Google Business Profile | Manager access now confirmed. Website and **07496 033321** are correct. The profile address says **115 City Road, Unit 1**; the website's separately approved wording is **Unit A**. | **Sonia/company owner:** reconcile Unit 1 versus Unit A, including the Companies House record, which also says Unit 1. Preserve the approved website address and leave the profile unchanged pending that decision. Do not request access again as if it were absent. |

No GTM version, website deployment, Sanity content or other Google configuration
was published or changed by these checks. No applicant/customer submission,
customer campaign or team email was sent.

## Remaining work and owners

| Item | Next concrete action | Owner / dependency |
| --- | --- | --- |
| Release review | Current-tree technical checks have passed as recorded below. Review Release 2 through PR #16 and arrange the separate deployment. | Surya; Deb/release owner for deployment. |
| Real tracking | Resolve the existing GTM ID/access, verify the saved tag configuration and prove no tracking before consent, one page event per navigation, withdrawal and actual GA4 receipt. | Deb/company container owner, then Surya. The meeting's suggestion of 50 tags is not a reason to invent tags outside the reviewed event contract. |
| Careers applications | Verify the hosted sender configuration and controlled application delivery, including actual recruiter inbox receipt, before enabling intake. The current application endpoint does not require a new database. | Deb/infrastructure and email owner; Sonia/HR confirms handling; Surya verifies the journey. |
| Four May audit reports | Obtain and identify the four source reports, reconcile each finding against code and live evidence, and record acceptance criteria/owner. | Deb/Shoaib/source owner supplies originals; Surya reconciles. The meeting's **62/70** figure remains reported, not independently verified. |
| Broader SEO | Use the existing six-tab audit reconciliation; inspect indexing examples, representative-page performance and remaining content/reference requirements. Request a new audit once the agreed changes are live and verified. | Surya for technical fixes; Shoaib for the fresh audit; Sonia/marketing for content priorities. The 18 September homepage lab pass remains limited to that run. |
| PolicyBee | Retain the selected **white badge with black outline**; retrieve/use the supplied original and resolve a provider verification URL if one exists. | Surya for asset preparation; Sonia/provider for verification. Do not revisit the answered colour choice or invent insurance claims. |
| ICO | Keep **C2039727** recorded as the paid application reference, not a confirmed registration certificate/number. | Sonia/company data-protection owner supplies the issued certificate or register evidence before a public registration claim. |
| Cardiff / hangar and Manchester | The 22 September email `1a0c8fc3adbfa1e2` supplies the [Hafren large commercial hangar/garage advert on City Road](https://www.hafrenproperties.co.uk/property/poa-large-commercial-hangar-garage-to-let-on-city-road-roath-cardiff-cf24-3bp/). Reconcile its exact identity with the earlier unspecified warehouse request; do not assume they are the same property. Retain the three Cardiff drafts and H22 Manchester draft, unresolved measurements/terms and separate publication holds. | Sonia/letting owner confirms identity/facts; Surya prepares only supported content. See the dated backlog note and H21/H22 receipts. |
| Hosted enquiries and receipts | Confirm Sheets versus Excel, reply ownership and service configuration; prove one enquiry saved → info inbox → agreed sheet → customer receipt → staff reply. | Sonia for destination/reply decision; Deb/company owners for infrastructure/sender; Surya for missing adapters and proof. |
| Review requests, report distribution and follow-up | Sonia coordinates genuine client review requests. Share the completed/pending report and arrange a follow-up after the team has a clear verified status. | Sonia/team and meeting organiser. This document is prepared for review; it has not been emailed and no meeting has been scheduled. |

Florence and unrelated held property/blog content remain unpublished. Other team
profiles remain held for contract/publication clearance. RERA, Rent Smart Wales,
Propertymark and VAT registration work is parked per the meeting; multilingual
content, Trustpilot invite automation, PR/co-marketing/syndication and HubSpot are
also parked. These are recorded decisions, not silently completed deliverables.

## Validation record and limits

- **408 unit tests passed across 57 files** on the final code, including team
  publication guards, application failure handling and the calculator.
- The primary **Next.js 16.3.4 Turbopack production build passed**, generating
  **88 routes**. A fresh analytics test build was also exercised after hardening.
- Calculator/sitemap/property-link focused suite: **36 passed**; changed-file
  lint and whitespace checks passed.
- After the route-allowlist extension, `npm run test:seo`: **7 passed**,
  including runtime checks that discard financial and applicant data. The two
  changed analytics files passed lint and whitespace checks.
- The fresh-build analytics browser suite passed **6/6** on desktop/mobile,
  covering no Google requests before acceptance, withdrawal, query privacy and
  excluded routes. Google traffic was intercepted in the test: this is browser
  behaviour evidence, **not actual Google receipt**.
- Local mobile calculator checks confirmed **250,000 / 5% / 25 years → 1,461.48
  monthly, 188,442.53 total interest**, and **120,000 / 0% / 10 years → 1,000
  monthly, zero interest**. Blank fields produced errors; changing to AED kept
  numeric values rather than applying an exchange rate.
- **4 careers policy/HTTP tests passed** against the final local production
  build: all nine reviewed roles and the careers index return 200; retired and
  unknown GET/HEAD/RSC requests return non-cacheable 404; disabled application
  requests are rejected before parsing. Navigation and sitemap checks pass.
- Whole-tree TypeScript, changed-file ESLint and whitespace checks pass. Shared
  Sanity schema validation reports **0 errors and 0 warnings**.
- Desktop/mobile review confirmed Sonia's portrait, both social links and Person
  schema; branded blog cards and a BlogPosting Organization author; the nine
  careers cards and unavailable intake. Calculator and careers layouts have no
  horizontal overflow at the measured 390px mobile viewport.
- Final HTTP checks verify `/cookie-policy` and its query variant return **308**
  to `/legal/cookie-policy`, preserving the query; the destination returns 200.
  Local tests/builds do not establish deployment, hosted delivery or real GA4 receipt.

Search Console's three 404 examples are `/cookie-policy` (last crawled 6 September),
`/&` (17 August), and `/properties/al-furjan-2-bedroom-apartment` (15 August).
The known policy replacement now has the redirect above, prepared in Release 2.
The malformed URL remains 404; the old property URL remains 404 until the exact
listing identity/replacement is confirmed. No blanket redirect or Search Console
validation request was submitted.

A read-only scan covered all 36 public CMS documents (26 posts, two properties,
eight FAQs). No Propertymark or Rent Smart Wales references remain there; RERA
mentions in six articles concern regulatory guidance or project compliance,
not Haus registration. Those educational references are preserved. No CMS
documents were changed by this task.

Portrait receipt: `public/team/sonia-baig.jpg`, SHA-256
`0622E81F595913170142AA4031EEFBD1F3D1C76B2DBFFAE27E11CD63E869F79F`.

Sources: the user's 22 September instructions and meeting summary; relevant
Sonia/Haus Gmail correspondence read in this task; the signed-in Google screens
above; the Companies House record; current repository code; and
[`seo-verification-2026-09-18.md`](seo-verification-2026-09-18.md),
[`backlog-reconciliation-2026-09-17.md`](backlog-reconciliation-2026-09-17.md),
[`release-1-analytics.md`](release-1-analytics.md) and
[`release-2-analytics.md`](release-2-analytics.md). The existing audit source is
the six-tab [SEO-Audit report-Haus_of_estate](https://docs.google.com/document/d/1BmDdxoRd6S6FFVqgozcCso-ta7XTPxvUHoLaBnD0IIY/edit);
it is not evidence that all four May reports have been supplied.
