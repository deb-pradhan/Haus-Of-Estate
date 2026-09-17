# Urgent careers closure — 18 September 2026

Sonia requested an immediate public careers takedown. Surya explicitly asked for
this small change on the existing SEO branch / PR #15 so Deb can review and
release it without waiting for Release 2. This is an exception to the normal
Release 2 development default, not permission to merge Release 2 into SEO.

## Prepared scope

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
must retain this closure when integrating Release 1. Reopening requires Sonia's
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

Surya needs to speak with Archi first thing in the morning. Sonia needs an
accurate confirmation after the corrections are actually released and checked.

## H12 tracking status

Sonia acknowledged the request at 23:26 UK on 17 September and said she would
arrange access in the morning. The status is **acknowledged; awaiting account
invitations and IDs**, not awaiting a reply or access granted. The request uses
`kommurisurya@gmail.com` for existing company GTM container ID/Edit, GA4
Measurement ID/Editor, and Search Console Full access. Do not duplicate it.
Real analytics receipt and audit performance targets remain unverified.

## Other urgent requests

H17 contact details are supplied and independent, so they are included. H01's
two property-label corrections are already Sanity drafts; publishing them is a
separate content action and is not included. The PolicyBee badge, campaign form,
hosted backend/email setup, replacement role publication and Florence are not
required for this takedown. Florence remains paused.

## Release and verification

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

Preparation and pushing the review branch do not make the public site change.
Deb must review/approve the existing PR and arrange deployment through the
normal process. No direct push to main, production deployment, CMS publication
or email send is authorised by this preparation.

Run `npm run test:careers-offline` for the isolated policy tests. For a LOCAL
production preview, set `HAUS_CAREERS_TEST_URL` to its localhost URL to run the
built page/API/sitemap/link checks as well. The integration check refuses public
hosts. Run the existing SEO checks, type check, changed-file lint and production
build; inspect desktop/mobile navigation and approved contact details.

After an approved deployment, verify public GET/HEAD responses for `/careers`
and known/unknown job URLs, absence of recruitment links and sitemap entries,
and correct contacts. Confirm the application closure without submitting real
applicant data. Report the deployed commit and results before telling Sonia it
is live.
