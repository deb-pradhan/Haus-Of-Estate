# Haus of Estate bot-protection handoff

Paste this into the separate ChatGPT account when continuing the work.

Repository: `deb-pradhan/Haus-Of-Estate`

Branch: `suryak02/bot-protection`, stacked on
`suryak02/auth-hardening`. Never push or merge directly to `main`.

This branch adds a reusable Cloudflare Turnstile Managed widget and mandatory
server-side Siteverify validation for password registration, forgotten-password
requests, and verification-email resends. Each route uses an exact action,
checks an explicit hostname allowlist, keeps the existing origin and
database-backed throttle controls, and performs verification before password
hashing, account lookup, writes, or email delivery. Tokens and form PII are not
stored or logged.

The feature is disabled by default with `BOT_PROTECTION_ENABLED=false`.
Enabling it also requires `TURNSTILE_SITE_KEY`,
`TURNSTILE_SECRET_KEY`, and `TURNSTILE_ALLOWED_HOSTNAMES`. Missing production
configuration fails closed. Cloudflare test keys and local hostnames are rejected
in production.

Credential login remains frictionless under the existing IP/email throttles for
this first release. Google OAuth and high-entropy token redemption are not gated.
The lead-intake work is on another branch; reuse this verifier there after the
branches are reconciled.

Before launch, Haus must own the Cloudflare widget, approve the privacy wording,
verify Railway proxy/IP handling, configure exact staging/production hostnames,
and test success, expiry, replay, provider outage, and rate-limit cases. See
`docs/BOT_PROTECTION.md` for the complete setup and rollout checklist.
