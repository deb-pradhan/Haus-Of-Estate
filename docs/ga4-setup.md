# GA4 setup checklist — property `G-FEZF22MELJ`

Owner-facing checklist for running hausofestate.com analytics in **GA4 direct mode** (no GTM). Technical background: [`release-1-analytics.md`](release-1-analytics.md#ga4-direct-mode-no-gtm).

Updated for the Release 2 integration on 5 October 2026. These are configuration and verification steps, not evidence of current Railway/GA4 settings or live event receipt. Real GA4 Realtime/DebugView receipt remains unverified.

## 1. Railway

- [ ] Verify service variable `NEXT_PUBLIC_GA4_ID=G-FEZF22MELJ`. Check spelling exactly — no spaces or quotes; this guide does not confirm the hosted setting.
- [ ] For direct mode, leave `NEXT_PUBLIC_GTM_ID` **unset**. A valid `GTM-…` container ID takes precedence over a valid `G-…` measurement ID. A missing/invalid GTM ID falls back to a valid GA4 ID; with neither valid, no analytics loads. `GT-55K83XLJ` is a Google tag ID, not an accepted container or measurement ID.
- [ ] **Redeploy after any change.** The value is baked into the site at build time; editing the variable alone does nothing until a new build runs. (The `Dockerfile` passes it through as a build `ARG`.)
- [ ] After the approved deployment, confirm the served revision and build-time configuration. Open https://hausofestate.com in a private window with DevTools → Network, filter `gtag`.
  - Before choosing on the cookie banner: **no** request to `googletagmanager.com/gtag/js`.
  - After clicking **Accept analytics** on an allowed public page: one request to `gtag/js?id=G-FEZF22MELJ`, then check for GA4 collection requests and actual receipt.
  - In a separate fresh session, after **Reject analytics**: no Google analytics requests. For withdrawal after acceptance, confirm the page reloads and no new tracking occurs.

## 2. GA4 Admin

| Setting | Where | Value |
| --- | --- | --- |
| Web data stream | Admin → Data streams | URL `https://hausofestate.com`, measurement ID `G-FEZF22MELJ` |
| **Enhanced measurement** | Data stream → Enhanced measurement | **Off** (all toggles) |
| Google signals | Admin → Data collection | Off |
| Ads personalisation | Admin → Data collection / Ads links | Off; no Google Ads links |
| Data retention | Admin → Data retention | 14 months |
| Key events | Admin → Events / Key events | No key event is enabled by this integration; any later configuration needs separate review (see below) |
| Internal traffic | Data stream → Configure tag settings → Define internal traffic | Office/home IPs, then activate the *Internal Traffic* data filter |

**Why Enhanced measurement must be off.** The site already sends its own sanitised `page_view` on every navigation. Enhanced measurement would add a second, automatic page view (double counting) and would collect raw URLs, site-search terms, outbound links and form interactions — data the site deliberately strips out.

**Events and key events.** The [12-event mapping](release-1-analytics.md#event-mapping-both-modes) includes the five public browsing/intent events and the seven existing lead/AskHaus events. `lead_submit_success` requires a successful intake response with a valid durable receipt; `newsletter_opt_in` additionally requires that explicit choice. Neither is renamed to `generate_lead`. Contact/search/handoff clicks are intent, not received enquiries. No conversion/key-event setting or customer messaging is enabled automatically. Any later lead key-event rule must exclude `interest = newsletter_only`; see the [Release 2 contract](release-2-analytics.md). Disabled intake/AskHaus features remain disabled.

**Custom dimensions** (Admin → Custom definitions, scope **Event**) — only if reports need them:

| Dimension name | Event parameter |
| --- | --- |
| Content path | `content_path` |
| Contact method | `contact_method` |
| Search intent | `intent` |
| Property category | `category` |
| Availability | `availability` |

Do not add free-text, user-ID or email dimensions.

**Internal traffic.** Start the filter in *Testing* state, confirm in Realtime that your own visits are tagged, then switch to *Active*. Until then, the team's own browsing inflates figures.

## 3. Verify live data

1. Open https://hausofestate.com in a fresh private/incognito window (extensions and ad blockers off).
2. Click **Accept analytics** on the banner.
3. Browse 3–4 pages: home → properties → a property → blog. Click a contact button.
4. GA4 → **Reports → Realtime**: verify the visit and `page_view`/`contact_click` arrive. Record the tested deployment, date and evidence; a script load or local `dataLayer` entry alone is insufficient.
5. For event-level detail, open [Tag Assistant](https://tagassistant.google.com), connect `https://hausofestate.com`, accept analytics in the debug window, then watch GA4 → **Admin → DebugView**. Check parameters contain no query strings, email addresses or search text.

Standard reports take 24–48 hours to fill; Realtime and DebugView are the immediate checks.

### Why GA totals will be lower than real traffic

The site loads analytics only after consent. Visitors who **reject or ignore** the cookie banner generate no application analytics events or GA cookies. GA4 measures consenting visitors on allowed hosts/routes, so its totals are not directly comparable with server logs or Railway metrics. Ad blockers can reduce delivery further.

## 4. Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| No data in Realtime | Did you click **Accept analytics**? A previous rejection is remembered for 180 days. | Footer → Cookie Settings → Accept, or use a fresh private window. |
| No `gtag/js` request after accepting | Ad blocker / privacy extension / Brave shields | Disable for the test, or use a clean browser profile. |
| No `gtag/js` request, no blocker | Variable name/value in Railway | Must be exactly `NEXT_PUBLIC_GA4_ID` = `G-FEZF22MELJ`. |
| Variable correct, still nothing | Build predates the change | Trigger a redeploy; confirm the new deployment is live. |
| GTM loads instead of gtag | A valid `NEXT_PUBLIC_GTM_ID` is set | For direct mode, remove it and rebuild/redeploy (valid GTM takes precedence). |
| Testing on a preview/staging URL | Host not in allowlist | Analytics only runs on `hausofestate.com` / `www.hausofestate.com` unless `NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS` is set. |
| Doubled page views | Enhanced measurement | Turn it off in the data stream. |
| Page URLs with `?query` or search terms in GA | Enhanced measurement | Turn it off; the site itself never sends these. |
| Own visits skewing numbers | Internal traffic filter | Define internal IPs and activate the filter. |
| Data in Realtime but not in reports | Processing delay | Wait 24–48 hours. |
