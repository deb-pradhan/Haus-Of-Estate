# Prisma migration baseline

`20260901000000_baseline` is an immutable representation of the physical
PostgreSQL schema on `origin/main` before this repository had migration
history. Do not edit or re-generate it after it has been reviewed.

## Existing Railway database

Do not run the baseline against an existing Haus database. Before deploying:

1. Back up the database and compare its live schema with the baseline SQL.
2. Resolve every discrepancy before continuing.
   The additive migration intentionally aborts if case-insensitive duplicate
   user emails exist. Resolve those identities with the account owners first.
3. Mark only the baseline as already applied:

   ```sh
   npx prisma migrate resolve --applied 20260901000000_baseline
   ```

4. Let Railway's pre-deploy command apply
   `20260901001000_auth_hardening` and each later additive migration only after
   Deb approves setting
   `HAUS_DATABASE_MIGRATIONS_APPROVED=20260901001000_auth_hardening@<reviewed-sha256>`
   for that deployment. The blocked pre-deploy output prints the exact value;
   Deb must compare its checksum with the reviewed migration before approval.
   Remove the value again after the approved rollout. Later
   code-only deploys pass with no approval when the database is already current;
   any new pending migration requires its own exact pending-set approval.

Never mark the auth-hardening migration as applied unless its SQL was applied
and verified independently. A new empty database can run all migrations with
`prisma migrate deploy`.

`20260901002000_saved_content` is the additive migration for account-owned
Sanity references. Apply it only after auth hardening is present and with its
own reviewed checksum approval. It stores immutable Sanity document IDs and
does not copy properties or articles into the dormant Prisma property catalog.

`20260901003000_property_assistant_usage` adds HMAC-keyed account/IP
fixed-window buckets, one stable non-PII global daily bucket, and short-lived
token reservations. It stores no prompts, transcripts, account IDs, IP
addresses, or Sanity content. The assistant must remain disabled until this
migration is approved and deployed; stale reservations are reclaimed on a
later request after their short expiry.

The auth migration expands the old verification representation safely. The
legacy Boolean `User.emailVerified` remains in place for deployment overlap and
rollback. A new `User.emailVerifiedAt` timestamp is backfilled from `createdAt`
only where the legacy value is `true`; Prisma maps Auth.js's
`emailVerified` field to that timestamp. Removing the Boolean is a later
contract migration after the old application code has been retired.

The auth migration likewise keeps an `oidc` default on `Account.type` so the
old application can create Google account links during overlap or rollback.
Removing that default belongs in a later contract migration.

Before rollout, count those unverified historical accounts and agree whether
they are disposable test users or need an owner-verification campaign. The new
login correctly refuses them; the old site never gave them a verification flow.
