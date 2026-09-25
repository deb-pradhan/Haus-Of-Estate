# Tracked social lead links

## “Have a query?” — Sonia's general enquiry link

Built on Release 2 on 17 September 2026; short bio link added on 21 September
in draft PR #16. The dedicated page remains `/enquire`, with `/ask` redirecting
to it. No account is required. The same short link can be used in every social
bio. It does not depend on an external link-shortening service.

After deployment, intake enablement and a successful hosted backend/delivery
test, use **`https://hausofestate.com/ask`** in the social bios, with wording such
as **“Have a query? Tell us what you're looking for.”** It is **prepared, not
live or ready to promote yet**. `/enquire` remains a valid direct page address.
Example optional tracked links for marketing:

- Instagram: `https://hausofestate.com/ask?utm_source=instagram&utm_medium=organic_social&utm_campaign=have_a_query`
- Facebook: `https://hausofestate.com/ask?utm_source=facebook&utm_medium=organic_social&utm_campaign=have_a_query`
- LinkedIn: `https://hausofestate.com/ask?utm_source=linkedin&utm_medium=organic_social&utm_campaign=have_a_query`

The short-link redirect preserves query parameters, so tagged platform visits
reach the same attribution-aware form. An untagged `/ask` link works on every
platform, but cannot guarantee platform identification when the platform hides
its referrer. Marketing can choose the plain link or the tagged version. These
links are examples for the approved launch; no social profile has been changed.

The page accepts general/service questions and buying, renting, investing or
selling/letting enquiries. It requires a question and reply details, with
optional marketing choices. It uses the existing durable lead intake/outbox.
The success screen confirms saved receipt, not email delivery. No campaign or
customer acknowledgement email was added. Company hosting, database, recipient,
delivery worker/provider and the agreed spreadsheet integration still need live
verification. Sonia's Google Sheet has already been supplied and read, but a
Google Sheets adapter and customer receipt remain unbuilt. Confirm whether it
replaces Excel and agree columns/automation access before connecting it. No
Google Analytics or GTM access is required for enquiry submission itself.

21 September short-link checks: Next's installed config-routing utility returned
307 from plain/tagged `/ask` to `/enquire`, retaining query values. The existing
www canonical redirect remains first; unrelated paths are unaffected. Six
SEO/analytics checks and focused lint passed. This verifies routing configuration,
not a deployment or end-to-end submission to external services.

## Detailed property brief

The existing `/register-interest` page remains available for a structured
property brief. Use these links only after it is enabled in production:

- Instagram: `https://hausofestate.com/register-interest?utm_source=instagram&utm_medium=organic_social&utm_campaign=bio`
- Facebook: `https://hausofestate.com/register-interest?utm_source=facebook&utm_medium=organic_social&utm_campaign=bio`
- LinkedIn: `https://hausofestate.com/register-interest?utm_source=linkedin&utm_medium=organic_social&utm_campaign=bio`
- X: `https://hausofestate.com/register-interest?utm_source=x&utm_medium=organic_social&utm_campaign=bio`
- YouTube: `https://hausofestate.com/register-interest?utm_source=youtube&utm_medium=organic_social&utm_campaign=bio`
- Pinterest: `https://hausofestate.com/register-interest?utm_source=pinterest&utm_medium=organic_social&utm_campaign=bio`

Test every link after deployment. It must retain its attribution through form
submission and must not preselect email marketing consent. Marketing retains
account access and is responsible for changing profile links.
