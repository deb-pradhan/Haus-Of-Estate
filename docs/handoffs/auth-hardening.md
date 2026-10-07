# Haus of Estate auth-hardening handoff

Paste this into the separate ChatGPT account when continuing the work.

Repository: `deb-pradhan/Haus-Of-Estate`

Branch: `suryak02/auth-hardening`, based on `origin/main`. This work is isolated
from the lead, sharing, purchase-readiness, and Sanity branches. Never push or
merge directly to `main`.

The branch replaces the unsafe account flow with verified credentials accounts,
optional disabled-by-default Google OAuth, generic enumeration-safe recovery
responses, hashed single-use verification/reset tokens, database-backed rate
limits, session-version revocation, sanitized post-login returns, and protected
route checks. Registration no longer creates a lead or grants marketing consent.
Raw action tokens are exchanged into short-lived HttpOnly cookies before an auth
screen renders, and verification requires an explicit user action.

Two migrations are committed: an immutable snapshot of the pre-migration schema
and a separate additive auth migration. Existing Railway must be backed up and
compared before marking only the baseline as applied. Nothing has been migrated
or deployed from this branch.

External dependencies before launch: Haus-owned Google OAuth credentials if
Google is enabled, a verified Resend sender, Railway environment variables and
database approval, exact company/privacy wording, and production browser tests.
Saved properties/articles belong in the later `suryak02/saved-content` branch.

Verification at branch freeze: Prisma validation, TypeScript, focused auth
lint, 51 Vitest tests, 12 desktop/mobile Playwright tests, and the 76-route
production build pass. Full repository lint retains unrelated baseline errors.
Docker/PostgreSQL migration integration was not run because Docker was stopped;
that remains an explicit staging gate, along with review of the remaining
transitive Prisma/Sanity audit advisories.
