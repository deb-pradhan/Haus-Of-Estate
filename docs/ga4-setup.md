# GA4 setup checklist — property `G-FEZF22MELJ`

Owner-facing checklist for running hausofestate.com analytics in **GA4 direct mode** (no GTM). Technical background: [`release-1-analytics.md`](release-1-analytics.md#ga4-direct-mode-no-gtm).

## 1. Railway

- [ ] Service variable `NEXT_PUBLIC_GA4_ID=G-FEZF22MELJ` is set (already done). Check spelling exactly — no spaces or quotes.
- [ ] `NEXT_PUBLIC_GTM_ID` is **unset**. If it is set, GTM mode takes over and GA4 direct mode is ignored.
- [ ] **Redeploy after any change.** The value is baked into the site at build time; editing the variable alone does nothing until a new build runs. (The `Dockerfile` passes it through as a build `ARG`.)
- [ ] Confirm it is live: open https://hausofestate.com in a private window with DevTools → Network, filter `gtag`.
  - Before choosing on the cookie banner: **no** request to `googletagmanager.com/gtag/js`.
  - After clicking **Accept analytics**: one request to `gtag/js?id=G-FEZF22MELJ`, then `collect` requests to `google-analytics.com`.
  - After **Reject analytics**: still nothing. That is correct.

## 2. GA4 Admin

| Setting | Where | Value |
| --- | --- | --- |
| Web data stream | Admin → Data streams | URL `https://hausofestate.com`, measurement ID `G-FEZF22MELJ` |
| **Enhanced measurement** | Data stream → Enhanced measurement | **Off** (all toggles) |
| Google signals | Admin → Data collection | Off |
| Ads personalisation | Admin → Data collection / Ads links | Off; no Google Ads links |
| Data retention | Admin → Data retention | 14 months |
| Key events | Admin → Events / Key events | None for Release 1 (see below) |
| Internal traffic | Data stream → Configure tag settings → Define internal traffic | Office/home IPs, then activate the *Internal Traffic* data filter |

**Why Enhanced measurement must be off.** The site already sends its own sanitised `page_view` on every navigation. Enhanced measurement would add a second, automatic page view (double counting) and would collect raw URLs, site-search terms, outbound links and form interactions — data the site deliberately strips out.

**Key events.** Leave key events unmarked for Release 1, per the analytics contract in `release-1-analytics.md`. All five events measure intent — `contact_click` is a click on a phone/email/WhatsApp/enquiry control, not a confirmed received enquiry — so marking any of them would overstate leads. A true key event (`generate_lead` on a confirmed enquiry submission) is planned for Release 2.

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
4. GA4 → **Reports → Realtime**: you should appear within about 30 seconds, with `page_view` and `contact_click` in the event card.
5. For event-level detail, open [Tag Assistant](https://tagassistant.google.com), connect `https://hausofestate.com`, accept analytics in the debug window, then watch GA4 → **Admin → DebugView**. Check parameters contain no query strings, email addresses or search text.

Standard reports take 24–48 hours to fill; Realtime and DebugView are the immediate checks.

### Why GA totals will be lower than real traffic

The site is consent-first under UK GDPR / PECR and the UAE PDPL. Visitors who **reject or ignore** the cookie banner are never counted — no script loads, no cookie is set. GA4 therefore reports consenting visitors only, and will always show fewer users than server logs or Railway metrics. This is by design, not a fault. Ad blockers reduce the figure further.

## 4. Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| No data in Realtime | Did you click **Accept analytics**? A previous rejection is remembered for 180 days. | Footer → Cookie Settings → Accept, or use a fresh private window. |
| No `gtag/js` request after accepting | Ad blocker / privacy extension / Brave shields | Disable for the test, or use a clean browser profile. |
| No `gtag/js` request, no blocker | Variable name/value in Railway | Must be exactly `NEXT_PUBLIC_GA4_ID` = `G-FEZF22MELJ`. |
| Variable correct, still nothing | Build predates the change | Trigger a redeploy; confirm the new deployment is live. |
| GTM loads instead of gtag | `NEXT_PUBLIC_GTM_ID` is set | Remove it and redeploy (GTM takes precedence). |
| Testing on a preview/staging URL | Host not in allowlist | Analytics only runs on `hausofestate.com` / `www.hausofestate.com` unless `NEXT_PUBLIC_ANALYTICS_ALLOWED_HOSTS` is set. |
| Doubled page views | Enhanced measurement | Turn it off in the data stream. |
| Page URLs with `?query` or search terms in GA | Enhanced measurement | Turn it off; the site itself never sends these. |
| Own visits skewing numbers | Internal traffic filter | Define internal IPs and activate the filter. |
| Data in Realtime but not in reports | Processing delay | Wait 24–48 hours. |
