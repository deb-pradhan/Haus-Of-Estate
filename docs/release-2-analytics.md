# Release 2 analytics contract

Release 2 retains the consent and host controls in [the Release 1 runbook](./release-1-analytics.md). Lead and AskHaus emitters use the same `trackAnalytics()` boundary. There is no direct `dataLayer` initialization in either feature and no recording or replay before consent. Newsletter/property-match permission and signing in do not grant analytics consent.

The existing application event names remain unchanged. Add exact Custom Event triggers and GA4 event tags using the same names below, with required `analytics_storage` consent. Every event includes the sanitized `page_path`, `page_location`, `page_title` and empty `page_referrer`; pass only those and the additional parameters listed here.

| Application and GA4 event name | Additional allowed parameters |
| --- | --- |
| `form_view`, `form_start`, `lead_submit_success`, `newsletter_opt_in` | `form_name` fixed to `lead_eoi`; bounded `form_version` (`YYYY-MM-DD.vN`); `surface` (`modal`, `manual_cta`, `newsletter`, `register_interest`); optional `interest` (`buy`, `rent`, `invest`, `sell_let`, `newsletter_only`), `step` (1–3), `has_project` (boolean) |
| `property_assistant_opened`, `property_assistant_adviser_handoff` | `route_scope` (`home`, `properties`, `property_detail`) derived from and checked against the current public route |
| `property_assistant_results_shown` | `route_scope` and bounded integer `result_count` (0–3) |

Optional lead parameters are explicitly null when absent/invalid to clear GTM's previously stored event values. Invalid surfaces or version formats suppress an event. Assistant events outside its discovery routes are suppressed. `/register-interest` is allowed as a public lead page; authentication and saved/account routes remain excluded. Names, contact details, project titles/slugs, search preferences, prompt/answer text, conversation IDs, session IDs and user IDs are never copied from feature arguments into analytics.

`lead_submit_success` is emitted only after a successful intake response, and `newsletter_opt_in` only after a successful response with that explicit choice. A rejected request emits neither. If configuring a lead key event, exclude `interest = newsletter_only`; newsletter consent is a separate subscription action. Property search and adviser/contact clicks remain intent measurements, not completed leads. Authoritative submission and marketing-consent records remain in the intake backend, independent of analytics permission.

`npm run test:seo` covers accepted/unknown/withdrawn consent, all preserved feature event names, rejected metadata, bounded result counts, empty optional values and PII removal at the shared runtime boundary. The functional lead/assistant Playwright suites run `next dev` without analytics and assert no events while forms/chat still function. The separate production browser consent suite exercises the actual consent manager with all Google endpoints intercepted. None of these checks establishes live GTM/GA4 delivery or sends customer messages.
