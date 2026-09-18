# Careers update — 13 September 2026

## Approved vacancies and preserved records

Sonia's 12 September list is represented exactly in `content/careers-roles.json`: Content Managers, Real Estate Agents, PR Interns, Videographers and Lead Generators. The index, detail routes, metadata/static parameters and application API use this same list. Submitted role titles are not trusted; the server supplies the approved title. Speculative and retired role submissions are rejected with guidance to choose a current opportunity.

A read-only query of the public Sanity production dataset on 13 September found eight open records, none with an exact approved title. They were Interior Design Intern, International Markets Associate — Remote, Lettings Specialist — Cardiff, Property Advisor — London, Property Management Intern, Social Media Manager, Staging Interiors Intern and Video Editor. The similar titles are not assumed to be equivalent roles.

The five approved roles therefore show titles and an application form without invented descriptions, locations, employment terms or requirements. Sanity remains the source for matching published role details when supplied. An explicit closed/draft status, or a different title under an approved slug, suppresses that entry. Queries use the published perspective; a CMS failure does not activate the fallback. The index explains temporary unavailability and the API returns 503.

All other role pages return not found and their API submissions are rejected. The About careers section and careers metadata no longer advertise unrelated vacancies or unconfirmed employment types. The existing sitemap contains only the careers index, not vacancy detail URLs.

No production record was changed or deleted. Existing seed documents retain their content with `status: closed` to avoid reopening retired roles on a later seed. `scripts/careers-september-2026.pending-patches.json` is a reviewable, unapplied closure plan for the eight observed IDs. Before any CMS cleanup, re-fetch the intended dataset's IDs/revisions and patch only status; do not import replacement documents over live editorial content. After deployment the public gates hide the legacy records independently of that cleanup.

## Portfolio report and verified limitations

The report was that an applicant could not link a portfolio and had a 13.8MB PDF. The original form supported a portfolio URL, not a portfolio file; it separately required a CV upload capped at 5MB. The API enforced the same CV size. A 13.8MB upload exceeds that cap, but this does **not** establish the applicant's actual failure: the attempted URL, browser error, hosting permissions and request trace are unknown. No applicant document or personal information was used in testing.

[Vercel documents a 4.5MB function request limit](https://vercel.com/docs/functions/limitations#request-body-size), so raising the multipart limit would not support a 13.8MB direct upload on that platform. The implementation now permits a CV attachment up to 4,000,000 bytes **or a CV sharing link**, caps the complete multipart request at 4,400,000 bytes, and checks both Content-Length and streamed bytes. The browser checks the same limits and offers file removal. Type and URL validation are shared between browser and API; surrounding URL whitespace is trimmed and unsupported file fields are rejected explicitly.

The portfolio field explains how to share a PDF through a document service, including large files, and asks applicants to check access permissions. CV and portfolio links reach HR in escaped email links; the server never downloads their contents. There is no new direct portfolio upload or hosted file storage. Access to a submitted sharing link remains dependent on its permissions.

HR routing remains `CAREERS_EMAIL` or the existing `hr@hausofestate.com` default. Careers email functions now fail when no email service is configured, when Resend reports an error, or when no message ID is returned. An application succeeds only after provider acceptance of the HR email. Confirmation is awaited separately; its failure does not ask the applicant to resubmit or claim that a confirmation was sent. Provider acceptance is not proof of final inbox delivery.

## Verification and handoff

- `npm test`: 16 passing mocked integration/unit tests covering exact role gates, eight legacy vacancies, CMS closure/outage, canonical HR email content, link alternatives, URL escaping, small attachments, missing/invalid CVs, a generated valid 13,800,000-byte PDF, streamed/declared/total body limits, unsupported portfolio files and provider failure paths. Sanity and Resend are mocked; no real email or database mutation occurs.
- `npm run typecheck`: passed after local `prisma generate`; generation does not connect to the database.
- Dependency lock retains all pre-existing package versions and entries; additions are the pinned Vitest runner and its required dependencies. `npm ci --dry-run --ignore-scripts --no-audit --no-fund` passed. Existing React peer and Node engine warnings remain.
- Manual browser verification at localhost:3018: index showed exactly five approved titles; selecting a valid synthetic 13,800,649-byte PDF immediately showed the 4MB limit and sharing-link alternative. Removing it and submitting synthetic CV/portfolio links with surrounding whitespace reached the API; the intentionally absent Resend key returned a visible 502/HR-contact message without showing “Application received.” At 390px width there was no horizontal overflow and the error remained visible. Synthetic PDF fixtures stay outside Git. No production deployment, CMS mutation or real application submission is part of this change.

All five approved detail URLs returned HTTP 200; the Interior Design Intern URL returned 404. Focused ESLint passed for the core application and careers changes. The About page points to current Careers openings instead of maintaining a second list that could become stale.

Business details still needed before richer listings: approved briefs/responsibilities/requirements, location and working arrangement, employment type, hours/duration, compensation and eligibility for each role. The current Sanity schema requires location and summary before publishing a complete record; do not fill those with guessed terms. Use the exact manifest slug/title when adding approved CMS content. Retired records should remain available to editors as closed history. Sonia and Archi should review this draft PR and coordinate the Monday 14 September release separately; no release or outbound coordination email was performed here.
