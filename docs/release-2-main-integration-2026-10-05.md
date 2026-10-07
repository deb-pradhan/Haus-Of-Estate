# Release 2 main integration — 5 October 2026

For Deb's review in [draft PR #16](https://github.com/deb-pradhan/Haus-Of-Estate/pull/16), on the existing `suryak02/azizi-florence-content-scaffold` branch. No production deployment, Sanity publication, feature activation or customer messaging is included.

## Ancestry and preservation

Normal merge commit **`773f369047dfb783cb58e24626d6ad46fb64ce80`** has these two parents:

- Release 2: `21ab82cc43fac6d42e4e8785a79fb8a80dbac47a`.
- Refetched main: `5e092e00be7813aa1c17af759ed636146c601c36` (Deb's direct GA4/Railway change).

Their common ancestor was `20afdeeb2b7c1de7ea46c67e9da8e8afbf8128fa`. Main is an ancestor of the merge; no rebasing or history replacement was used. Integration and testing used an isolated worktree, with no new feature branch. The canonical checkout's dirty personal handoff, TypeScript configuration, untracked handoffs and local assets were preserved. Raw Florence packages and prepared media remain outside this commit.

## Semantic resolutions

- `analytics.ts`: retain Release 2's expanded public-route and approved-careers allowlist, lead/AskHaus validation and parameter restrictions. Merge direct GA4 dispatch and explicitly map all twelve events. A valid GTM ID wins; otherwise a valid GA4 ID works without GTM. Neither valid ID loads no analytics. Stop the previously active measurement ID when configuration changes, as well as on consent withdrawal.
- `layout.tsx` and `ConsentManager`: pass the GA4 ID while preserving request-time rendering, draft handling, auth/readiness gates and currency/saved-content providers.
- `Dockerfile`: combine public GA4/GTM/host and existing site/Sanity build settings before `next build`; keep runtime dependencies, database-preparation wrapper and migration files. No server credentials were added to build arguments.
- `package.json` and Playwright: retain Release 2's scripts and add the GA4 suite. Use separate build, port and results directories for the two modes.
- Documentation: replace current GTM-only prerequisites with valid-ID precedence/direct fallback. September dashboard observations remain dated evidence. Actual GA4 receipt is still unverified.

No property, Florence design/schema/preparation, careers policy, card, author-credit, footer, ICO or PolicyBee artwork files changed relative to the Release 2 parent. The existing 80px badge and shared property rendering remain intact. Application event emitters and feature flags were not changed: lead success still requires a valid durable receipt, newsletter measurement still requires the explicit newsletter choice, and disabled features remain disabled.

## Verification performed locally

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed, including final browser test additions |
| ESLint on changed application, Playwright configuration and browser-test TypeScript | Passed |
| `npm test` | 542 tests passed across 72 files; includes feature gates, receipt checks, Florence and shared property presentation |
| `npm run test:seo` | 9 tests passed, including all twelve analytics mappings and rejected metadata |
| `node --test scripts/prepare-release-database.test.mjs` | 5 tests passed; disabled release preparation does not touch the database |
| `npm run test:careers-offline` with `HAUS_CAREERS_TEST_URL=http://localhost:3131` | 4 passed, no skips; approved browsing works, retired/unknown roles and intake stay unavailable |
| `scripts/prepare-florence-variants.test.py` with bundled Python | 10 synthetic filesystem-safety tests passed; no real PDFs/media processed |
| Fresh GTM and direct-GA4 production builds | Both passed with their exact respective configuration environments |
| `npm run test:analytics:browser` | 8 passed, desktop and Pixel 7 |
| `npm run test:analytics:browser:ga4` | 8 passed, desktop and Pixel 7 |
| `git diff --check` and merge-conflict checks | Passed |

Both production builds were freshly generated from the integrated application using each Playwright configuration's `webServer.env`. The browser commands then used `ANALYTICS_SKIP_BUILD=1` against those same fresh artifacts. GTM uses `.next-analytics`, port 3131 and `test-results-analytics`; direct GA4 uses `.next-analytics-ga4`, port 3132 and `test-results-analytics-ga4`. Both configurations explicitly disable auth, saved content, AskHaus, lead intake/delivery/Sheets, careers intake, snagging booking and purchase readiness. No server credentials were copied into the integration worktree.

The GTM build contains both valid fake IDs to prove precedence; the direct build contains only the GA4 fake ID. Google analytics/ad requests are intercepted, service workers blocked, and application API writes aborted. Checks cover pre-consent/rejection, acceptance, manual sanitized views and all five public interactions, same/cross-tab withdrawal, private/preview/draft/unlisted-host exclusions and the seven additional Release 2 events. A test-only browser document bundles the real analytics module to exercise those seven events without enabling operational forms or inventing an accepted enquiry. It asserts direct GA4 command format, GTM object format, allowlisted parameters, PII removal and withdrawal. Existing form/API tests separately cover receipt-gated emission.

One intermediate GA4 run exposed a test timing race when reopening the server-rendered Cookie Settings control before its listener hydrated. The test now waits for page scripts to settle after reload; the complete final GA4 run passed. No application code change was needed for that test race.

## Remaining release boundaries

- Deb must review the cumulative PR and separately approve any merge/deployment. This work does not build a Docker image or verify Railway settings/runtime deployment.
- Configure the chosen public analytics ID(s) at build time, retain the allowed-host controls and verify current GA4 settings, including Enhanced measurement off. Then prove actual consented Realtime/DebugView receipt on the approved deployment. Mocked Google scripts and local queues do not establish receipt.
- Accounts, saved content, AskHaus, website intake/delivery and careers intake retain their existing activation holds. Hosted database, staff/recruiter inbox, Sheet receipt and retry checks remain separate; approved careers browsing is already independent of intake.
- Florence and other held content remain unpublished. Brochure delivery, acknowledgements and marketing automation are not enabled by analytics consent or by this merge.

See [the current GA4 checklist](ga4-setup.md), [Release 2 event contract](release-2-analytics.md) and [deployment handoff](deb-release-2-handoff-2026-09-28.md).
