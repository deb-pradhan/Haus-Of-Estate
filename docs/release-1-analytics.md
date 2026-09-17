# Release 1 — SEO and analytics — next to deploy

Branch: `suryak02/technical-seo-fixes`. Keep this release ahead of the cumulative Florence / website overhaul branch. Deployment and publication of the GTM container remain separate from preparing the PR.

Update, 18 September: Sonia acknowledged the access request at 23:26 UK on
17 September and will arrange it in the morning. Await the company GTM ID/Edit,
GA4 Measurement ID/Editor and Search Console Full invitations for
`kommurisurya@gmail.com`; the reply did not grant access or supply IDs. Do not
resend the request. PR #15 now also prepares the explicitly requested urgent
careers closure and contact corrections; see
[`urgent-careers-closure-2026-09-18.md`](urgent-careers-closure-2026-09-18.md).

## What the site implements

- `NEXT_PUBLIC_GTM_ID` remains the only required application analytics setting. Leave it unset until the correct GTM container is ready. Its value is public, such as `GTM-ABC1234`, never a private token or a GA4 measurement ID.
- Optional `NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS` is an exact, comma-separated hostname allowlist. Unset/blank defaults to `hausofestate.com,www.hausofestate.com`. An explicit list replaces those defaults: use `hausofestate.com,www.hausofestate.com,demo.hausofestate.com` when enabling a named demo too. No wildcard, protocol, port or path is accepted. For controlled local testing only, set `localhost` (and `127.0.0.1` separately if needed). A nonempty invalid list enables nothing. Rebuild after changing this public setting.
- Basic consent: no GTM script, iframe, analytics requests, or queued activity before consent. Equal accept/reject buttons; persistent, versioned choices for 180 days; footer Cookie Settings supports later acceptance or withdrawal. Advertising consent remains denied. Storage failure fails closed across documents.
- Analytics runs only in production builds on allowed hosts and explicitly allowed public pages. Local hosts and Vercel previews remain excluded by default; a named demo/preview host must be explicitly configured. `next dev`, authentication, saved/account pages, Studio, APIs, draft mode, and preview/token/secret query routes remain excluded even on an allowed demo host. Canonical, query-free page locations are retained on demo hosts; use a test GTM/GA4 container before recording real demo traffic.
- Manual page events include the current public pathname once per navigation. Query-only filter changes do not create another page view. GTM initialization receives only the current consented page, without replaying earlier visits or clicks.
- Application event parameters are allowlisted. Page locations use the canonical host and omit query strings and fragments; referrer is empty; title is a coarse page category. No DOM text, full link URLs, email addresses, form answers, chatbot messages, search terms, user IDs, or selected location labels enter the event payload.
- Withdrawal stops new application events, disables known Google tags, removes accessible GA cookies, and immediately reloads to unload previously executed scripts/timers. A request already in flight cannot be recalled. SPA navigation to an excluded route becomes a full document navigation; browser back/forward is checked again before events and resets the loaded tag when excluded.
- Homepage search now reports search activity and opens property results. It no longer reports a submitted lead or promises an agent response.

## Required GTM and GA4 configuration

This application boundary depends on the container below. Do not publish arbitrary automatic tags into it.

1. In the intended GA4 property, create or select the website data stream for `https://hausofestate.com` and copy its `G-…` measurement ID into a **Google tag** in the matching GTM container. Use **Initialization — All Pages** as the Google tag trigger. Require additional consent `analytics_storage` for this tag and every GA4 event tag.
2. Set Google tag configuration parameters `send_page_view` = boolean `false`, `allow_google_signals` = boolean `false`, and `allow_ad_personalization_signals` = boolean `false`. Disable Google Signals and advertising personalisation in the GA4 property. Do not add Ads, remarketing, user-provided-data, User-ID, or cross-domain linker tags.
3. In GA4 Admin → Data streams → the web stream, turn **Enhanced measurement off**, including history-based page views, site search, outbound clicks, form interactions, scroll, video and downloads. Otherwise GA can collect automatic duplicates or unsanitized URLs/form activity outside this application event contract.
4. Create GTM **Data Layer Variables, Version 1** for `page_location`, `page_path`, `page_referrer`, `page_title`, `content_path`, `contact_method`, `form_location`, `intent`, `category`, and `availability`. Use no fallback to GTM Page URL, Referrer, Click URL, Click Text, browser title, or DOM variables. Every application event includes the four `page_*` fields. Configure these same four variables as Google tag settings and on each event tag so automatic GA system events also use the sanitized page context.
5. Add one **Custom Event** trigger per application event, with exact matching and no regex. Create the corresponding **Google Analytics: GA4 Event** tag, referencing the Google tag / its measurement ID and passing only the parameters shown below. Do not create All Pages, History Change, All Clicks, form-submission, or other automatic event triggers. Do not configure GA4 create/modify-event rules that duplicate these events.

| Application custom event | GA4 event name | Event parameters, in addition to all four `page_*` fields |
| --- | --- | --- |
| `haus_page_view` | `page_view` | none |
| `haus_property_click` | `property_click` | `content_path` |
| `haus_article_click` | `article_click` | `content_path` |
| `haus_contact_click` | `contact_click` | `contact_method` (`phone`, `email`, `whatsapp`, `contact`, `enquiry`) |
| `haus_property_search` | `property_search` | `form_location`, `intent`, `category`, `availability` |

6. Do **not** mark property search, property/article clicks or contact clicks as lead submissions/key events. They measure intent, not a successfully received enquiry. Release 2 must gate any actual successful lead event through the same consent helper and explicitly allowlist its fields. GA4 may additionally emit its own session/first-visit/engagement system events after consent; these must inherit the sanitized page settings.
7. Register custom dimensions for the additional parameters only if reports need them. Do not add free text dimensions. Publish the reviewed GTM version only after testing. Set `NEXT_PUBLIC_GTM_ID` in the production build environment and rebuild; the variable is embedded at build time.

## Verification before calling analytics live

Automated code checks use `npm run test:seo`; they do not demonstrate actual GA4 receipt. Run `npm run test:analytics:browser` for a production build and six Chromium browser scenarios across desktop and Pixel 7 viewports. Install the pinned browser with `npx playwright install chromium` once if needed. This suite explicitly allows only `localhost`, uses placeholder `GTM-TEST123`, intercepts GTM with a local stub, and aborts Google analytics/ad endpoints before any request leaves the browser. It checks consent/rejection persistence, sanitized SPA navigation and clicks, search classification, withdrawal/cookie removal, private-route document navigation, draft mode, an unlisted loopback host, and cross-tab withdrawal. Screenshots and failure traces go to ignored `test-results/`. `ANALYTICS_SKIP_BUILD=1` can reuse an unchanged build made by this exact test configuration during test-only iteration; leave it unset for release verification.

With Deb's GTM edit/publish and GA4 property access, use the correct container's Tag Assistant and GA4 DebugView / Realtime on the controlled deployment:

- Fresh browser, desktop and mobile: before a choice and after rejection, assert no `googletagmanager.com` / `google-analytics.com` requests and no `_ga` cookies. Refresh and confirm rejection persists.
- Accept on one public page: verify one GTM load and one `page_view`. Navigate `/` → `/properties` → a Florence property → `/blog` → an article. Verify one page event per pathname, no duplicate configured or enhanced page views, and matching sanitized location/title/referrer. Query-only changes must not add a page view.
- Click a property, article, phone/email/WhatsApp CTA, enquiry button, and run a property search. Check exact mapped events and allowed parameters. Search must never produce `lead_form_submit` or `generate_lead`. Search text, email addresses, tokens and fragments must not appear anywhere in requests or event data.
- With prior acceptance, use Cookie Settings → Reject analytics. Confirm document reload, removal of GA cookies where accessible, no subsequent analytics requests, and no load after refresh. In a second tab, withdrawal must also stop and unload tracking in the first tab.
- With prior acceptance, navigate directly, through SPA links/programmatic navigation, and via back/forward to authentication, Studio, draft/preview and excluded routes. Confirm the private document has no loaded analytics and emits no events. Test a preview on a public path with draft mode enabled as well.
- No GTM ID, invalid ID, unavailable storage and blocked GTM must leave browsing and consent controls usable. A blocked GTM request means delivery is unavailable; do not report it as successful measurement.

Record the GTM published version, GA4 property/data stream, tested deployment, event screenshots, and verification date in the release PR. **Pending:** account/container access and real GA4 receipt are not established by this code change; no live analytics verification is claimed.

Local verification on 13 September 2026: six unit/SEO checks and all six browser scenarios passed, along with TypeScript, changed-file ESLint and the production build. Desktop and mobile consent screenshots were inspected. The browser walkthrough included real public navigation/property/article/contact clicks, search, rejection/acceptance persistence, same-tab and cross-tab withdrawal, cookie removal, private SPA navigation, back/forward, Studio, draft mode and the unlisted `127.0.0.1` host. GTM was replaced with a harmless browser stub and Google analytics/ad endpoints were intercepted; this validates application behavior, not a live GTM container or GA4 collection.

References: [Google basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [consent setup](https://developers.google.com/tag-platform/security/guides/consent), [manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views), [enhanced measurement](https://support.google.com/analytics/answer/9216061), [avoiding PII](https://support.google.com/analytics/answer/6366371).
