# Bot protection

This branch adds disabled-by-default Cloudflare Turnstile protection on top of
the existing origin checks, email verification, and database-backed throttles.
It does not replace any of those controls.

## Protected operations

- Password account registration: action `register`
- Forgotten-password email requests: action `forgot_password`
- Verification-email resend requests: action `resend_verification`

Credential login remains under its existing IP and email throttles in this
first release. Google OAuth, action-token exchange, verification, and password
reset are not gated because they already require proof from Google or possession
of a high-entropy, single-use token. The shared verifier can be extended to
login or lead intake in a separately reviewed change if abuse data supports it.

## Request flow

The protected routes run checks in this order:

1. Reject cross-origin requests.
2. Parse and bound the JSON body and Turnstile token.
3. Apply the existing database-backed IP throttle.
4. Verify the token with Cloudflare Siteverify.
5. Apply the email-specific quota only after a valid challenge, so invalid
   tokens cannot spend another person's recovery allowance.
6. Only then perform password hashing, account lookup, database writes, or
   email delivery.

Siteverify receives only the secret, challenge token, an idempotency key, and a
trusted client IP when the reviewed proxy configuration supplies one. It never
receives a name, email, password, return path, or other form data. Tokens are not
stored or logged. A response is accepted only when Cloudflare reports success
and returns the exact expected action and an explicitly allowed hostname.

Missing challenges return `400`, rejected challenges return `403`, existing
throttles return `429`, and provider or configuration failures return `503`.
The client receives generic messages and resets the single-use widget after
every unsuccessful submission.

## Environment

Leave the feature off until the privacy and production configuration gates are
approved:

```dotenv
BOT_PROTECTION_ENABLED="false"
TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
TURNSTILE_ALLOWED_HOSTNAMES="hausofestate.com,www.hausofestate.com"
```

Create separate Cloudflare widgets for local/testing, staging, and production.
The production widget must use exact approved hostnames and production keys.
The application rejects Cloudflare test site keys, localhost, and IP hostnames
when `NODE_ENV=production`.

Cloudflare's official always-pass local/test pair is:

```dotenv
BOT_PROTECTION_ENABLED="true"
TURNSTILE_SITE_KEY="1x00000000000000000000AA"
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
TURNSTILE_ALLOWED_HOSTNAMES="localhost,127.0.0.1,dummy-key-pass"
```

Never use those keys in production. The secret and Siteverify URL remain
server-only; the server page passes only the public site key to the widget.

## Launch gates

1. Haus must own the Cloudflare account and production widget.
2. Sonia must approve the user-facing wording.
3. The privacy owner must approve the Turnstile disclosure and the unconfirmed
   controller details elsewhere in the current privacy policy.
4. Railway's trusted client-IP header topology must be verified.
5. Staging must confirm valid, expired, replayed, mismatched-action, wrong-host,
   provider-outage, and rate-limit behavior.
6. If a Content Security Policy is introduced, allow the exact Cloudflare
   Turnstile script and frame origin documented by Cloudflare.

The lead-intake PR is on a separate branch. Add this same verifier to
`POST /api/leads` only when those branch lines are reconciled; do not duplicate
or silently copy the implementation.

Official implementation references:

- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/
- https://developers.cloudflare.com/turnstile/reference/content-security-policy/
- https://www.cloudflare.com/turnstile-privacy-policy/
