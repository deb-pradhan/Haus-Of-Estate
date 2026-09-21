# SEO audit comparison — 18 September 2026

18 September scope: the **Technical SEO** tab of the [SEO audit](https://docs.google.com/document/d/1BmDdxoRd6S6FFVqgozcCso-ta7XTPxvUHoLaBnD0IIY/edit?tab=t.0), read through a signed-in Markdown export, Release 2 tree `3671f5a1`, merged Release 1 changes, Git history and live HTTP checks. That tab contains four numbered findings plus rendering/image concerns under item 3. Its screenshot references do not include image contents, so screenshot details were not independently interpreted. **On 21 September all six audit tabs were read; the expanded reconciliation below supersedes any suggestion that this four-item tab was the entire audit.**

| Audit finding | Current conclusion | Evidence / remaining acceptance |
| --- | --- | --- |
| **1. Homepage Trustpilot link returns 404.** | **Addressed by removing the unapproved destination; verified absent live.** | Release 1 removed the Trustpilot and generic Google-search review links. At 22:27 and again 22:49 UTC, homepage HTML contained neither destination. The source regression test also passes. This does not validate the site's remaining rating/testimonial claims or establish a replacement verified review profile. |
| **2. Facebook and Instagram missing from the footer on every page.** | **Already implemented before Release 1; present live.** | Deb's commit `1bd9b3b1` (19 August) added the current footer links. At 22:49:45 UTC the actual live homepage `<footer>` contained Instagram `https://www.instagram.com/haus_of_estate/` and Facebook `https://www.facebook.com/profile.php?id=61560983191278`. Home/About/Contact live HTML also contained both. Shared footer source supplies public pages; this was not a complete every-URL crawl. Do not label this still missing or newly introduced by the SEO release. |
| **3. Mobile LCP 3.0 s; recommended <2.5 s.** | **Pass in one fresh mobile homepage lab run.** | The official PageSpeed browser report at 23:49:38 UK recorded **2.3 s** (calculator value 2,253 ms). R1 includes relevant homepage server rendering, cached refreshes, responsive image sizes and deferred offscreen work. This is not a controlled before/after comparison with the audit's 3.0 s, and does not establish sitewide or field performance. Repeat comparable runs and extend to other templates. |
| **3. Mobile TBT 310 ms; recommended <200 ms.** | **Pass in the same mobile homepage lab run.** | The official report recorded **20 ms** (calculator value 16 ms). R1 reduces homepage client work and defers noncritical modal/phone-input code. The result is comfortably below the audit threshold for this run; six code tests alone would not establish it. TBT is a lab measure, not a field Core Web Vitals result. |
| **3. Rendering and image-blocking issue.** | **Relevant improvements and strong homepage result; remaining opportunities identified.** | Server-rendered homepage sections, responsive image sizing and deferred below-fold rendering are implemented. The fresh report still estimates **550 ms render-blocking savings** and **46 KiB unused JavaScript**. These diagnostics merit focused review even though the two audit metrics passed once. No claim that every page or image is fixed; exported screenshot contents were unavailable. |
| **4. www/non-www both return 200 independently; asks for www → non-www 301.** | **Canonical-host duplication corrected live, with 308 rather than literal 301.** | At 22:28 UTC `https://www.hausofestate.com/` returned one 308 to the apex, then 200. `https://www.hausofestate.com/about?source=seo-check` returned one 308 to the same apex path/query, then 200. No loop. This meets the permanent canonical-host objective; record the status-code difference explicitly if the reviewer requires 301 exactly. |

## Historical social destination correction

Git shows About previously used Instagram `https://www.instagram.com/hausofestate/` and Facebook `https://www.facebook.com/hausofestate`. Commit `1bd9b3b1` changed those to the current destinations and added them to the footer. The old footer explicitly omitted Instagram; its comment said the old account was suspended. That comment is historical source text, not independently verified platform status. **21 September correction:** the separate social-links tab explicitly reports that the old Instagram destination led to a Thai account and gives `haus_of_estate` as the intended handle. The current URL matches that supplied handle. This confirms what Tanu reported, not an independent investigation of the old account's ownership/location. The tab names “Haus of Estate Page” for Facebook without supplying a precise replacement URL; the reachable current Haus-named page still needs company ownership confirmation if that remains disputed.

At 22:49:26 UTC, the current Instagram URL returned HTTP 200 without a redirect. Facebook redirected once (301) to `https://www.facebook.com/people/Haus-of-Estate/61560983191278/`, then returned 200. These checks establish reachable destinations and the Facebook display slug, not company account ownership or approval.

## Verification limits and tracking update

- Official browser report: [PageSpeed Insights mobile homepage](https://pagespeed.web.dev/analysis/https-hausofestate-com/low2lev69p?form_factor=mobile), **18 September 2026, 23:49:38 UK**. Performance **98**, LCP **2.3 s**, TBT **20 ms**, FCP **1.2 s**, CLS **0**, SEO **100**, accessibility **92**. Moto G Power emulation, Lighthouse **13.4.1**, slow 4G, initial page load. **No field data**. Both numerical audit thresholds pass this one run; the SEO score does not mean the complete SEO programme is finished.
- `npm run test:seo` re-run on `3671f5a1`: **6 passed, 0 failed**. This verifies source/runtime guards, not Lighthouse scores or GA4 receipt.
- Normal Windows/Node DNS for the apex failed. Live HTTP verification used the A record from Google public DNS (`69.46.46.24`) through `curl --resolve`, retaining the original HTTPS hostname and full certificate validation. No DNS settings were changed.
- Raw HTTP/redirect evidence: `.git/live-closure-http-2026-09-18.json`. The earlier unauthenticated PageSpeed API returned 429 / daily quota 0 (`.git/pagespeed-api-mobile-2026-09-18.json`); this limitation was subsequently overcome by the official browser report above.
- Separately, the root agent inspected GA4 property **550966592**, measurement ID **G-FEZF22MELJ**, with editable property details accessible. **Actual data receipt remains unproved; the exact role label was not shown.** Search Console access to the `hausofestate.com` domain is confirmed; its existing `www` sitemap reports **Success**, last read **18 September**, **34 discovered pages**. An Add sitemap control was available, but the explicit Full role label was not inspected. Surya's GTM account list is empty: container access remains missing, which does not prove the company has no container. **21 September:** the correct GA4 property still reports no received data and the GTM list is still empty. The broader Priority 1 audit tab does request GA/GSC setup, XML/HTML sitemaps and Meta tracking; these were absent only from the narrower Technical SEO export.
- Verdict: **the known Trustpilot/footer-link issues are addressed, canonical redirection works live, and both numerical thresholds pass one fresh mobile homepage lab run.** Remaining acceptance is repeatability, other-page coverage, render-blocking/unused-code opportunities, and separate tracking verification. Do not describe every finding as unfixed or claim a sitewide field Core Web Vitals pass, controlled causal speed improvement, ranking gain, or complete SEO programme.

## 21 September — complete six-tab audit reconciliation

Read all tabs in the same signed-in Google Doc: Priority 1, Priority 2, Technical
SEO issues, social-link PRD, Thin Content, and 1 September hreflang additions.
The UI reports its last edit as 1 September by Tanu Sonker. This is additional
scope discovered in the existing audit, not six new audits or a new instruction
to implement every item now. No new performance run was performed today.

| Requirement beyond the four-item technical tab | Existing position and remaining work |
| --- | --- |
| Every-page Core Web Vitals, image/render blocking and mobile speed | The 18 Sep homepage lab result above passes LCP/TBT for deployed R1 only. Broader templates, repeat runs, real-user metrics and R2 performance still need testing. Rendering savings remain diagnostic opportunities. Surya handles the next bounded measurement batch; Deb owns the deployed test environment. |
| GA, Search Console, sitemaps and Meta | H12: GA4 property/access and GSC sitemap Success established; today's GA4 still receives no data and GTM list is empty. Sonia/company owner supplies only the existing GTM container ID/Edit access. H13: Meta integration/access and real event receipt remain outstanding. Do not add an unconditional second tracker. |
| OAI-SearchBot not blocked in robots/CDN | Main and R2 already allow `/` for `User-agent: *`, disallow `/api/` and `/studio/`, and advertise the XML sitemap. This predates R1 (`ff4b5fd2`, 1 July). No OAI-specific source block was found. CDN/WAF policy and actual crawler retrieval remain unverified; Deb owns that external check. |
| Remove homepage RERA/FCA claims | The exact reported claims were removed before R1 (`164e6ed9`, 20 August). Absent current source and the homepage text inspected 21 Sep. Do not recreate those claims or count their removal as new R2 work. |
| XML and HTML sitemaps | XML sitemap already exists; GSC reported Success on 18 Sep. R2 fixes actual CMS modification dates. Neither branch contains a dedicated HTML sitemap route; that part of the audit is not completed. |
| Correct About social accounts | Existing Instagram matches the audit's supplied `haus_of_estate` handle. Current Facebook leads to a reachable Haus-named page; the audit supplies no exact replacement URL. Corrections predate R1; ownership confirmation remains a company decision if disputed. |
| Blog tables and references | Main and R2 already have `contentTable` schema/rendering (`f80a4c28`, 28 July) and underlined links. A richer table editor/plugin is not demonstrated. Editors can add manual reference headings/links, but no dedicated source field/automatic reference component or article-by-article reference audit is established. |
| Thin content, keywords and taxonomy | The audit flags six article URLs and one category URL below. Historical word counts do not by themselves prove current content quality. Fatima/Tanu own editorial priorities, evidence and keyword/topic decisions; Surya implements agreed CMS/layout support. No wholesale article rewrite was performed. |
| Homepage/community media, resource/news/download area, service enquiries and assistant | Existing video/testimonial sections, blog, H04 enquiry work and H15 AskHaus address parts of the request. H07 campaign delivery and H14 Latest News/PDF/LinkedIn scope remain separate unfinished work. Existing UI does not prove connected AI or delivered enquiries. |
| Country/language hreflang | The `ar`, `fr` and `en-GB` snippets are examples, not approved alternate pages. Company/content owners must provide real localized equivalents; Surya verifies their indexability, self-canonicals and reciprocal links. Do not fabricate alternate URLs or self-identical country pages. |

The Thin Content tab's exact URLs are:

- `/blog/dubai-real-estate-market-insights-july-2026`
- `/blog/haus-of-estate-global-partnerships`
- `/blog/dubai-vs-london-property-returns`
- `/blog/transparency-in-real-estate`
- `/blog/uae-property-market-2026`
- `/blog/building-global-property-portfolio`
- `/blog?category=investment-guides`

The appropriate next technical step is the missing GTM connection and real
consented receipt, followed by a representative-page performance check. The
broader editorial and marketing programme needs Tanu/Fatima/Sonia's priorities;
it is not established complete by a Lighthouse SEO score of 100.
