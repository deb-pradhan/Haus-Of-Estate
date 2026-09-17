# Tracked social lead links

## “Have a query?” — Sonia's general enquiry link

Built on Release 2 on 17 September 2026. Demo locally at
`http://127.0.0.1:3217/enquire`. Localhost only works on the machine running it;
use the agreed hosted test URL for Sonia to review remotely.

After deployment, intake enablement and a successful hosted backend/delivery
test, the public link will be `https://hausofestate.com/enquire`. It is **not
declared live by this document**. Example tracked links for marketing:

- Instagram: `https://hausofestate.com/enquire?utm_source=instagram&utm_medium=organic_social&utm_campaign=have_a_query`
- Facebook: `https://hausofestate.com/enquire?utm_source=facebook&utm_medium=organic_social&utm_campaign=have_a_query`
- LinkedIn: `https://hausofestate.com/enquire?utm_source=linkedin&utm_medium=organic_social&utm_campaign=have_a_query`

The page accepts general/service questions and buying, renting, investing or
selling/letting enquiries. It requires a question and reply details, with
optional marketing choices. It uses the existing durable lead intake/outbox.
The success screen confirms saved receipt, not email delivery. No campaign or
customer acknowledgement email was added. Company hosting, database, recipient,
delivery worker/provider and any Excel integration still need live verification.

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
