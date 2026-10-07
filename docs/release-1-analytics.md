# Release 1 — merged SEO and analytics runbook

Release 1 / [PR #15](https://github.com/deb-pradhan/Haus-Of-Estate/pull/15) was
merged into `main` at `20afdeeb` and deployed on 18 September 2026. Historical
branch `suryak02/technical-seo-fixes` is retired; do not recreate it. Continue
feature work in Release 2 / draft PR #16 on
`suryak02/azizi-florence-content-scaffold`. The website's consent implementation
is retained. The current Release 2 integration also supports direct GA4 without a
GTM container. Real GA4 collection remains unverified in either mode. Current
owner checklist: [`ga4-setup.md`](ga4-setup.md).

Historical observation, 22 September: GA4 property **550966592**, stream **15476606535** and
measurement ID **G-FEZF22MELJ** are accessible; Search Console access and the
existing sitemap Success are confirmed. Do not repeat the old three-service
invitation request. Surya still sees no GTM accounts/containers. The supplied
Google tag **GT-55K83XLJ** is linked to the measurement ID, but neither identifier
is a **GTM-…** container ID for `NEXT_PUBLIC_GTM_ID`.

At approximately 20:40–20:50 UK the GA4 UI reported no data in 48 hours.
Enhanced measurement and Signals were already off. Under the authorised consent
setup, ads personalisation was saved and confirmed from 307/307 to **0/307
allowed** at approximately 20:48 UK. No GTM version was published. The container
request at that checkpoint applied to the then GTM-only implementation; direct
mode now removes that dependency. These settings/access observations were not
rechecked on 5 October. See the
[`22 September report`](website-update-2026-09-22.md) for the public build check,
saved setting, indexing snapshot and current owners.

## What the site implements

- A valid public `NEXT_PUBLIC_GTM_ID` (`GTM-…`) selects GTM. Otherwise a valid `NEXT_PUBLIC_GA4_ID` (`G-…`) selects direct GA4. Valid GTM takes precedence when both are configured; an invalid GTM ID does not prevent the direct fallback. With neither valid ID, no analytics loads. A `GT-…` Google tag ID is neither accepted setting. Both IDs are public build-time configuration, never private tokens.
- Optional `NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS` is an exact, comma-separated hostname allowlist. Unset/blank defaults to `hausofestate.com,www.hausofestate.com`. An explicit list replaces those defaults: use `hausofestate.com,www.hausofestate.com,demo.hausofestate.com` when enabling a named demo too. No wildcard, protocol, port or path is accepted. For controlled local testing only, set `localhost` (and `127.0.0.1` separately if needed). A nonempty invalid list enables nothing. Rebuild after changing this public setting.
- Basic consent: no GTM/gtag script, iframe, analytics requests, or queued activity before consent. Equal accept/reject buttons; persistent, versioned choices for 180 days; footer Cookie Settings supports later acceptance or withdrawal. Advertising consent remains denied. Storage failure fails closed across documents.
- Analytics runs only in production builds on allowed hosts and explicitly allowed public pages. Local hosts and Vercel previews remain excluded by default; a named demo/preview host must be explicitly configured. `next dev`, authentication, saved/account pages, Studio, APIs, draft mode, and preview/token/secret query routes remain excluded even on an allowed demo host. Canonical, query-free page locations are retained on demo hosts; use a test GTM/GA4 container before recording real demo traffic.
- Manual page events include the current public pathname once per navigation. Query-only filter changes do not create another page view. Tag initialization receives only the current consented page, without replaying earlier visits or clicks.
- Application event parameters are allowlisted. Page locations use the canonical host and omit query strings and fragments; referrer is empty; title is a coarse page category. No DOM text, full link URLs, email addresses, form answers, chatbot messages, search terms, user IDs, or selected location labels enter the event payload.
- Withdrawal stops new application events, disables known Google tags, removes accessible GA cookies, and immediately reloads to unload previously executed scripts/timers. A request already in flight cannot be recalled. SPA navigation to an excluded route becomes a full document navigation; browser back/forward is checked again before events and resets the loaded tag when excluded.
- Homepage search now reports search activity and opens property results. It no longer reports a submitted lead or promises an agent response.

## GTM mode configuration

These container steps apply only when a valid GTM ID selects GTM mode. For direct mode, use the section below and the same GA4 property restrictions. Do not publish arbitrary automatic tags into a GTM container.

1. Use the existing GA4 property **550966592** and web stream **15476606535** above, with measurement ID **G-FEZF22MELJ**, in a **Google tag** in the intended company GTM container. Do not duplicate the property or stream. Use **Initialization — All Pages** as the Google tag trigger. Require additional consent `analytics_storage` for this tag and every GA4 event tag.
2. Set Google tag configuration parameters `send_page_view` = boolean `false`, `allow_google_signals` = boolean `false`, and `allow_ad_personalization_signals` = boolean `false`. Disable Google Signals and advertising personalisation in the GA4 property. Do not add Ads, remarketing, user-provided-data, User-ID, or cross-domain linker tags.
3. In GA4 Admin → Data streams → the web stream, turn **Enhanced measurement off**, including history-based page views, site search, outbound clicks, form interactions, scroll, video and downloads. Otherwise GA can collect automatic duplicates or unsanitized URLs/form activity outside this application event contract.
4. Create GTM **Data Layer Variables, Version 1** for the four `page_*` fields and each additional parameter in the mapping below. Use no fallback to GTM Page URL, Referrer, Click URL, Click Text, browser title, or DOM variables. Every application event includes the four `page_*` fields. Configure these same four variables as Google tag settings and on each event tag so automatic GA system events also use the sanitized page context.
5. Add one **Custom Event** trigger per application event, with exact matching and no regex. Create the corresponding **Google Analytics: GA4 Event** tag, referencing the Google tag / its measurement ID and passing only the parameters shown below. Do not create All Pages, History Change, All Clicks, form-submission, or other automatic event triggers. Do not configure GA4 create/modify-event rules that duplicate these events.
6. Do **not** mark property search, property/article clicks or contact clicks as lead submissions/key events. They measure intent. No key event or conversion is enabled by the application integration. GA4 may additionally emit its own session/first-visit/engagement system events after consent; these must inherit the sanitized page settings.
7. Register custom dimensions only if reports need them; do not add free text dimensions. Publish a reviewed GTM version only as a separately approved release action after testing. Set `NEXT_PUBLIC_GTM_ID` in the build environment and rebuild.

## Event mapping (both modes)

All 12 event names pass through the shared consent and parameter allowlist. Direct mode maps them in code; GTM mode requires the equivalent reviewed event tags. The [Release 2 contract](release-2-analytics.md) defines bounds and permitted values for lead and AskHaus metadata.

| Application custom event | GA4 event name | Event parameters, in addition to all four `page_*` fields |
| --- | --- | --- |
| `haus_page_view` | `page_view` | none |
| `haus_property_click` | `property_click` | `content_path` |
| `haus_article_click` | `article_click` | `content_path` |
| `haus_contact_click` | `contact_click` | `contact_method` (`phone`, `email`, `whatsapp`, `contact`, `enquiry`) |
| `haus_property_search` | `property_search` | `form_location`, `intent`, `category`, `availability` |
| `form_view` | `form_view` | `form_name`, `form_version`, `surface`, `interest`, `step`, `has_project` |
| `form_start` | `form_start` | same lead metadata as `form_view` |
| `lead_submit_success` | `lead_submit_success` | same lead metadata; successful intake response with valid durable receipt required |
| `newsletter_opt_in` | `newsletter_opt_in` | same lead metadata; receipt and explicit newsletter choice required |
| `property_assistant_opened` | `property_assistant_opened` | `route_scope` |
| `property_assistant_results_shown` | `property_assistant_results_shown` | `route_scope`, `result_count` |
| `property_assistant_adviser_handoff` | `property_assistant_adviser_handoff` | `route_scope` |

Lead success is not inferred from a click or an HTTP response without a valid receipt. Neither success event proves staff/customer inbox delivery. Any later lead key-event rule must exclude `interest = newsletter_only`. No event is renamed to `generate_lead`; no messaging, lead intake or AskHaus feature is enabled by this integration.

## GA4 direct mode (no GTM)

The direct GA4 support merged from `main` into Release 2 provides a fallback when no valid GTM container is configured. Continue feature work on the existing Release 2 branch. Owner checklist: [`ga4-setup.md`](ga4-setup.md).

- **Mode selection (build time):** valid `NEXT_PUBLIC_GTM_ID` → GTM mode. Missing/invalid GTM plus valid `NEXT_PUBLIC_GA4_ID` (e.g. `G-FEZF22MELJ`) → GA4 direct mode. Neither valid → no analytics. All host, route, consent and withdrawal rules above apply unchanged in both modes.
- **Loading:** `gtag.js?id=G-…` loads only after the visitor accepts analytics, on an allowed host and public page. Nothing is requested before consent or after rejection.
- **Config:** `gtag('config', …)` with `send_page_view: false`, `allow_google_signals: false`, `allow_ad_personalization_signals: false`; `ad_storage`, `ad_user_data` and `ad_personalization` stay denied.
- **Events:** sent directly with `gtag('event', …)` using all 12 GA4 names and the same allowlisted parameters in the table above. No GTM event-tag mapping is required.
- **GA4 Admin still required:** Enhanced measurement off, Google signals and ads personalisation off. Do not add automatic duplicate events, User-ID or user-provided-data collection. No key event is configured automatically.
- **Build:** `NEXT_PUBLIC_*` values are embedded by `next build`. The `Dockerfile` must declare `ARG NEXT_PUBLIC_GA4_ID` (and `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS`) before the build step so Railway service variables reach the build. Changing any of them requires a redeploy.

## Verification before calling analytics live

Automated code checks use `npm run test:seo`; they do not demonstrate actual GA4 receipt. Run `npm run test:analytics:browser` for a production build and Chromium scenarios across desktop and Pixel 7 viewports. Install the pinned browser with `npx playwright install chromium` once if needed. This suite explicitly allows only `localhost`, sets both valid placeholders `GTM-TEST123` and `G-TEST123456` to verify GTM precedence, intercepts GTM with a local stub, and aborts Google analytics/ad endpoints before any request leaves the browser. It checks consent/rejection persistence, sanitized SPA navigation and clicks, search classification, withdrawal/cookie removal, private-route document navigation, draft mode, an unlisted loopback host, and cross-tab withdrawal. It uses `.next-analytics` on port `3131`, with screenshots and failure traces in ignored `test-results-analytics/`.

For direct mode, `npm run test:analytics:browser:ga4` uses `.next-analytics-ga4` on port `3132`, with results in ignored `test-results-analytics-ga4/`. It leaves GTM unset, supplies the valid GA4 placeholder and intercepts Google endpoints. Each suite requires a build from the current application revision with its exact configuration environment; never reuse the other mode's artifacts. `ANALYTICS_SKIP_BUILD=1` may run against such a freshly prepared build. For this integration, both builds were freshly generated with their exact configuration environments before using that flag to run the browser checks. These local suites do not establish real delivery.

With the deployment owner and GA4 property access, verify the selected mode through Tag Assistant and GA4 DebugView / Realtime on the controlled deployment. GTM edit/publish access is needed only for GTM mode:

- Fresh browser, desktop and mobile: before a choice and after rejection, assert no `googletagmanager.com` / `google-analytics.com` requests and no `_ga` cookies. Refresh and confirm rejection persists.
- Accept on one public page: verify one selected GTM or gtag load and one `page_view`. Navigate `/` → `/properties` → an existing published property → `/blog` → an article. Verify one page event per pathname, no duplicate configured or enhanced page views, and matching sanitized location/title/referrer. Query-only changes must not add a page view; held Florence drafts remain unpublished.
- Click a property, article, phone/email/WhatsApp CTA, enquiry button, and run a property search. Check exact mapped events and allowed parameters. Search must never produce `lead_form_submit` or `generate_lead`. Search text, email addresses, tokens and fragments must not appear anywhere in requests or event data.
- With prior acceptance, use Cookie Settings → Reject analytics. Confirm document reload, removal of GA cookies where accessible, no subsequent analytics requests, and no load after refresh. In a second tab, withdrawal must also stop and unload tracking in the first tab.
- With prior acceptance, navigate directly, through SPA links/programmatic navigation, and via back/forward to authentication, Studio, draft/preview and excluded routes. Confirm the private document has no loaded analytics and emits no events. Test a preview on a public path with draft mode enabled as well.
- Missing/invalid IDs, unavailable storage and blocked Google scripts must leave browsing and consent controls usable. Confirm invalid GTM plus valid GA4 selects direct mode, and neither valid ID loads nothing. A blocked request is not successful measurement.

Record the selected mode, GTM published version if applicable, GA4 property/data stream, tested deployment, event screenshots, and verification date in the release PR. **Pending:** hosted build configuration, current property settings and real consented GA4 receipt. GTM container access is a dependency only for GTM mode. Historical GA4/Search Console access evidence is above; no fresh external check or live receipt is claimed by this integration.

Local verification on 13 September 2026: six unit/SEO checks and all six browser scenarios passed, along with TypeScript, changed-file ESLint and the production build. Desktop and mobile consent screenshots were inspected. The browser walkthrough included real public navigation/property/article/contact clicks, search, rejection/acceptance persistence, same-tab and cross-tab withdrawal, cookie removal, private SPA navigation, back/forward, Studio, draft mode and the unlisted `127.0.0.1` host. GTM was replaced with a harmless browser stub and Google analytics/ad endpoints were intercepted; this validates application behavior, not a live GTM container or GA4 collection.

References: [Google basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [consent setup](https://developers.google.com/tag-platform/security/guides/consent), [manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views), [enhanced measurement](https://support.google.com/analytics/answer/9216061), [avoiding PII](https://support.google.com/analytics/answer/6366371).
