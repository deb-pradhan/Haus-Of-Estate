# Urgent careers closure — 18 September 2026

Sonia requested an immediate public careers takedown. Surya explicitly asked for
this small change through the existing SEO branch / PR #15, independently of the
overhaul. PR #15 is now merged and deployed; the closure and approved contacts
are verified live and retained in Release 2. The SEO remote branch is retired.
Ongoing work uses the existing Release 2 branch and draft PR #16 against `main`;
closed PR #12 preserves the earlier review/history.

## Implemented scope

- Block `/careers` and every descendant with a non-cacheable HTTP 404 and
  `X-Robots-Tag: noindex`, including direct, query and prefetch/RSC requests.
- Stop career page rendering, role metadata and static role generation before
  CMS queries. Reject `/api/applications` before parsing or sending anything,
  including submissions from old cached forms.
- Remove careers navigation/footer/About recruitment links and sitemap entry.
- Preserve careers components, job documents, previous application evidence and
  the improved Release 2 application handling. No CMS documents are changed.
- Include the independent approved H17 correction: Unit A office address,
  existing UK calling number, and Dubai business WhatsApp for general contacts.
  The careers WhatsApp feature itself remains inaccessible; it is not merely
  repointed to the new number.

The closure is code-controlled in `src/lib/careers-availability.ts`, not an
environment flag or CMS status that can be inadvertently enabled. Release 2
retains this closure and must not restore recruitment on deployment. Reopening requires Sonia's
approval and a reviewed change covering routes, API, metadata and discovery.

## Replacement content held for reopening

These are the exact headings and titles from Sonia's email, clarified by Surya.
They replace the previous list; they must not be published alongside it. Do not
invent descriptions or contract types for Career Experience Openings. Replace
Interior Designer with the self-employed Real Estate Agent role when reopening.
Remove “Life at HoE”, the old +44 7721 096676, the careers WhatsApp question
feature, full-time/part-time hiring wording and “Advisory” from reopened content.

### Lettings Agent

- Lettings Specialist - UK Nationwide - Self Employed

### Sales Agent

- Sales Specialist - UK Nationwide - Self Employed
- Real Estate Agent - UK Nationwide - Self Employed

### Career Experience Openings

- Content Writer
- Video Content Creator
- Graphic Designer
- Content Manager
- Content Strategist

The original handoff recorded Surya's plan to speak with Archi first thing in
the morning; completion of that conversation has not been established here.
The public checks below now support an accurate confirmation of the careers
closure and contact corrections to Sonia. No message was sent by this update.

## H12 tracking status

Sonia acknowledged the request at 23:26 UK on 17 September. Subsequent UI checks
confirm GA4 account `405511552`, property `550966592` (`www.hausofestate.com`),
Measurement ID `G-FEZF22MELJ`, and editable property settings. That establishes
editor-level settings capability, not the exact assigned role label. GA4 reports
no data received. Surya's GTM container list is empty; the company container's
access/ID and configuration remain unresolved.

Search Console domain property `hausofestate.com` is accessible. Settings show
non-owner access and an available add-sitemap UI, consistent with Full
capabilities; no exact role label was displayed. Do not request another Search
Console invitation. Confirm the role only if needed for a specific operation.

The [official mobile homepage PageSpeed report](https://pagespeed.web.dev/analysis/https-hausofestate-com/low2lev69p?form_factor=mobile)
at 23:49 UK on 18 September reports LCP **2.3 s**, TBT **20 ms**, Performance
**98** and SEO **100**. The two speed targets pass in this single homepage lab
run. Field data says **No Data**; site-wide/repeated performance and actual GA4
collection remain unverified. Six SEO/analytics code checks also passed again.

## Other urgent requests

H17 contact details are supplied and independent, so they are included. H01's
two property-label corrections are already Sanity drafts; publishing them is a
separate content action and is not included. The PolicyBee badge, campaign form,
hosted backend/email setup, replacement role publication and Florence are not
required for this takedown. Florence remains paused.

## Release and verification

PR #15 merged into `main` at `20afdeeb2b7c1de7ea46c67e9da8e8afbf8128fa`.
GitHub's Railway production deployment `6521282619` records success for that
commit at 09:20:32 UTC on 18 September. This is deployed-commit evidence, separate
from the following public behavior checks.

At 22:27 UTC on 18 September, public GET checks for `/careers` and known/unknown
job URLs returned 404 with `X-Robots-Tag: noindex` and `Cache-Control: no-store`.
A harmless malformed `/api/applications` POST returned 404 with the closed
message; no applicant data was submitted. Desktop/mobile header, footer and
About checks at 23:53 UK found no recruitment links. The Unit A address and Dubai
business WhatsApp are live. These checks support reporting the urgent change as
live; the earlier local suite below additionally covered HEAD and RSC requests.

Release 2 retains the closure. Merge `3671f5a1` reconciles `main` ancestry without
changing the tracked tree from `aeb8b613`. Draft
[PR #16](https://github.com/deb-pradhan/Haus-Of-Estate/pull/16) now targets `main`,
replacing closed #12 after its retired base prevented reopening. The overhaul
has not been deployed by this branch preparation.

### Historical local verification before deployment

Release 2 forward-merge verification, 18 September: Next.js 16.3.4 production
build and TypeScript passed. Twenty-one careers/closure/sitemap tests, five
focused authentication/saved-page tests, six SEO/analytics checks and all four
built closure checks passed. The original application tests explicitly enable
the retained implementation in isolation; the separate closure test verifies
the real disabled policy reads no request body and makes no CMS/email call.
Changed-file ESLint passed. Built anonymous account/messages/viewings requests
still redirect to login with their return path, and the login page returns 200.
Desktop/mobile menus, contacts and the closed careers page were inspected.
R2's newer search menu, snagging, enquiry and account navigation are preserved.

Verified locally on 18 September using Release 1's Next.js 16.1.6 production
build (`next build --webpack`): build and TypeScript passed; six SEO/analytics
checks and all four careers closure checks passed, including the built HTTP
suite with `HAUS_CAREERS_TEST_URL=http://127.0.0.1:3315`. GET/HEAD, role URLs,
RSC/prefetch, malformed application POST, sitemap and public link checks passed.
Desktop and 390px mobile navigation were inspected; contact details and a
direct job URL's unavailable page were checked in the browser. An independent
code review found no concrete closure bypass.

Changed-file ESLint still reports the baseline `no-explicit-any` error and
five unused-variable/import warnings in the preserved careers pages. These
were already present before the closure; the full lint run is not claimed to
pass. No application data, CMS document or production service was modified.

The historical preparation above did not itself deploy production. PR #15's
subsequent merge/deployment and live verification are recorded separately above.
Current Release 2 preparation still does not authorise a direct push to main,
production deployment, CMS publication or email send.

Run `npm run test:careers-offline` for the isolated policy tests. For a LOCAL
production preview, set `HAUS_CAREERS_TEST_URL` to its localhost URL to run the
built page/API/sitemap/link checks as well. The integration check refuses public
hosts. Run the existing SEO checks, type check, changed-file lint and production
build; inspect desktop/mobile navigation and approved contact details.

For future approved deployments, verify public GET/HEAD responses for `/careers`
and known/unknown job URLs, absence of recruitment links and sitemap entries,
and correct contacts. Confirm the application closure without submitting real
applicant data. Report the deployed commit and results before telling Sonia it
is live.
