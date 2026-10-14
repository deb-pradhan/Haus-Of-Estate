# Authentication hardening

This branch hardens the existing Auth.js credentials and optional Google login.
Account registration is deliberately separate from lead capture and marketing
consent.

## Behaviour

- Credentials accounts must verify their email before signing in.
- Verification and password-reset tokens are random, stored only as hashes,
  single-use, and time limited.
- Email links exchange their raw token for a short-lived HttpOnly cookie and
  redirect to a clean, analytics-free URL. Verification still requires a
  deliberate button press.
- A password reset increments `User.sessionVersion`, invalidating older JWT
  sessions.
- Token redemption uses serializable transactions; after a replacement email
  is accepted, older links of the same type are retired.
- Registration, login, resend, verification, forgotten-password, and reset
  operations use database-backed throttles keyed with HMAC hashes.
- Google is absent unless `AUTH_GOOGLE_ENABLED=true` and both Google credentials
  are configured. Auth.js does not use dangerous automatic account linking.
- Protected handlers must still authorize beside their data access; `proxy.ts`
  is only an early navigation check.

## Required environment

Use `.env.example` as the reference. In production:

1. Set independent high-entropy `AUTH_SECRET` and `AUTH_THROTTLE_SECRET` values.
2. Set `NEXT_PUBLIC_SITE_URL=https://hausofestate.com` so emailed links use the
   canonical origin.
3. Set `AUTH_TRUST_HOST=true` only where the deployment controls the Host header.
4. Set `AUTH_TRUST_PROXY_HEADERS=true` only after confirming Railway replaces,
   rather than merely appends, client-supplied forwarding headers.
   Set `AUTH_CLIENT_IP_HEADER=x-real-ip` for Railway; do not trust a
   client-selectable Cloudflare or forwarded header unless that CDN topology is
   separately reviewed.
5. Configure and verify `AUTH_EMAIL_FROM` in Resend.
6. Keep Google disabled until Haus owns the OAuth app and the exact callback URL
   `https://hausofestate.com/api/auth/callback/google` is registered.

## Database rollout

Do not run the baseline migration against the existing Railway database. Follow
`prisma/migrations/README.md`: take a backup, compare the live schema, mark only
`20260901000000_baseline` as applied, and then let `prisma migrate deploy` apply
the additive auth migration. No database is migrated by this pull request.
Railway fails closed unless the one-deployment gate
`HAUS_DATABASE_MIGRATIONS_APPROVED=20260901001000_auth_hardening@<reviewed-sha256>`
is set after Deb verifies the checksum printed by the blocked pre-deploy, and
remove it after the rollout. An up-to-date database needs no
approval on later code-only deploys, while any different pending set fails closed.

The migration also normalizes historical email casing and aborts on collisions.
It leaves the legacy verification Boolean in place and adds a separately mapped
timestamp so old and new deployments can overlap or roll back safely.
Audit the number of old unverified accounts before rollout: the old application
did not provide verification, while the hardened login correctly blocks them.

## Launch checks

- Verify registration sends an email without creating a `Lead`.
- Verify unknown and known email reset requests return indistinguishable text.
- Verify used and expired tokens fail, and a password reset signs out old sessions.
- Verify Google is hidden while disabled and works only on the canonical callback.
- Configure GTM triggers to exclude `/auth/*` as a defence in depth measure.
- Review the privacy policy's account-data/controller wording before launch.

The local verification suite passes without a database service, but Docker was
not running on the development machine. Before staging, replay the baseline and
additive migration against both a fresh PostgreSQL database and a production-
shaped backup, then run registration, verification, login, reset, revocation,
and concurrent sibling-token tests end to end.

`npm audit --omit=dev` has no critical advisories after the Auth.js, Next.js,
Prisma, and Resend upgrades. It still reports transitive high-severity findings
through the runtime Prisma migration CLI and Sanity toolchain. Review their
runtime reachability and track upstream fixes; do not apply the audit's
incompatible forced downgrade automatically.

The previous prototype's new-login alert has been retired. It depended on
client-supplied device text and had no durable delivery path. Reintroduce alerts
only with trusted server metadata and an email outbox.
