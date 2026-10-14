# Website email scenarios and Sonia handoff — 16 September 2026

Draft for review; no message sent. This checks the Release 2 source and existing
setup notes, not a live database, provider account or inbox. No service was
started, account created, customer contacted or secret inspected.

## What exists and what remains

| Area | Evidence in the repository | Remaining work |
| --- | --- | --- |
| Enquiries and staff notifications | `src/lib/lead-intake/persistence.ts` saves the enquiry, separate consent records and a delivery event together. `src/lib/lead-delivery/runtime.ts` selects Power Automate or ZeptoMail. | Connect and verify the hosted test database, worker and chosen delivery route. API success or provider acceptance does not establish inbox receipt. |
| Excel | The Power Automate contract requires an Excel row and team notification before acknowledging completion; setup is documented in `docs/lead-delivery-rollout.md`. | Sonia must identify the company workbook/table and its owner; the Microsoft integration owner must configure access and the flow. A spreadsheet link alone is insufficient. |
| Customer enquiry receipt | The lead API returns an on-screen acknowledgement; the outbox sends a staff notification. | Add a separate receipt email after successful persistence. No customer enquiry receipt is implemented in this path. |
| Accounts and careers | `src/lib/email/auth.ts` and `src/lib/email/resend.ts` use Resend. Careers includes team delivery and applicant acknowledgement. | Prove actual delivery in hosted testing; these direct sends do not share the lead outbox's durable retries. |
| Newsletter and property matches | Separate opt-ins, wording/version evidence, criteria and withdrawal-storage functions exist in `src/lib/lead-intake/` and `prisma/schema.prisma`. | Public unsubscribe/preferences flow, subscriber verification, provider synchronisation, bounce/complaint suppression and sending remain unfinished. An `ACTIVE` subscription record does not prove email ownership. |
| Personalised follow-up | Accounts, saved Sanity references and editable AskHaus handoff preferences provide foundations. | Identified interest capture, inactivity tracking, recommendations and a separate customer-email queue are not implemented. |

Power Automate and ZeptoMail are **alternative staff-delivery routes today**.
ZeptoMail sends an internal enquiry email with customer Reply-To; it does not
also populate Excel. Its adapter is not a customer marketing system.

The hosted-staging note recommends consolidating automatic website emails on
Resend. That is a proposal, not an approved vendor choice or completed migration;
the durable lead-delivery Resend adapter still needs building. Establish whether
Haus already has a working approved sender before creating another account.
Keep the Excel requirement explicit when choosing the staff-delivery route.

Mailchimp is a proposed marketing service; no Haus account, audience or plan has
been selected or connected in this work. Its APIs support contact events and
marketing automation, with features depending on the plan, and audience
webhooks can report unsubscribes back to the website. This still needs an
integration; selecting Mailchimp alone would not create the Haus follow-up flow.
Sources: [Mailchimp events](https://mailchimp.com/help/use-events-behavioral-targeting/),
[audience webhooks](https://mailchimp.com/developer/marketing/guides/sync-audience-data-webhooks/).
ZeptoMail restricts its service to transactional messages and excludes marketing
campaigns/newsletters. Source: [ZeptoMail terms](https://www.zoho.com/zeptomail/terms.html).

## Proposed customer journeys

These are designs for agreement, not enabled behaviour. All intervals below are
examples, not decisions or promised response times.

| Scenario | Proposed behaviour | Eligibility and stopping rule |
| --- | --- | --- |
| Someone submits an enquiry | Save it, queue the team notification and send a simple customer receipt acknowledging the specific request. The team then replies from its monitored inbox. | An enquiry can be answered without adding the person to marketing. Receipt must not imply a confirmed viewing, quotation or team review. |
| A known visitor browses relevant properties, then becomes inactive | For example, a verified person permits personalised follow-up, views/saves two-bedroom Dubai apartments and later receives a short selection of relevant available properties after **48 hours without recorded activity**. | Require verified identity plus applicable marketing and interest-capture permission. Anonymous browsing, signing in alone or analytics consent cannot trigger outreach. A new visit resets the proposed delay; an active team conversation pauses it. |
| AskHaus helps someone narrow their search | Show an editable summary such as city, property type, bedrooms and budget. Offer a clear choice to use that summary for future matches. | Save only the preferences the person confirms for this purpose. Do not store raw conversations as a marketing profile or silently convert a handoff into a subscription. |
| Someone subscribes to the newsletter | Fatima prepares an approved email with useful article summaries and links, including a PDF download where available; the selected campaign provider delivers it. **Monthly** is an example cadence. | Newsletter permission is separate from property-match permission. A downloadable PDF or published article is not an email-delivery system. |
| A useful article fits someone's interests | Include a relevant published article alongside matches when the person's permission covers those article recommendations. Otherwise keep the message within their property-match brief. | Existing property-match wording covers matching properties/opportunities, so do not silently broaden historical opt-ins to article newsletters or browsing-based targeting. |

For the first personalised pilot, propose staff review before sending, a maximum
of **one personalised follow-up per seven days**, and no repeated message unless
there is a fresh relevant reason. Those limits are examples to agree with Sonia
and marketing. Newsletter and personalised schedules need a shared contact limit.
If no suitable published property/article exists, send nothing.

Use a small first-party interest record in the website database, linked to a
verified person: permitted property/article references, confirmed preferences,
last relevant activity and consent evidence. Do not infer a closed browser;
measure elapsed time since the server last recorded permitted activity. A
verified subscriber would need a secure way to identify their website session;
an anonymous browser cannot be matched to an email by guesswork.

GA4 stays separate: the current `src/lib/analytics.ts` contract measures coarse
public activity without contact details, account IDs, detailed preferences or
AskHaus text. Treat it as aggregate/pseudonymous measurement, not a list of known
email recipients. Real GTM/GA4 collection also remains unverified pending access.

At send time, recheck the current permissions, unsubscribe/bounce/complaint
suppression, last activity, contact limit, duplicate history and current Sanity
publication/availability. Give recipients a working unsubscribe and preference
link. Provider opt-outs must cancel pending messages and flow back to the website;
an old opt-in must not overwrite a newer withdrawal. Agree interest retention
and implement deletion/expiry; existing privacy-page retention wording is not
evidence of an implemented cleanup process.

## Next dependencies, by owner

| Owner | Concrete input or next step |
| --- | --- |
| Sonia | Confirm the monitored enquiry inbox and reply owner, identify the existing Excel workbook/owner, and name the business owner for email accounts and sending approvals. |
| Deb / hosting and DNS owners | Give named access to the isolated hosted test environment and database; identify existing transactional/campaign accounts and sender-domain ownership. Confirm any account/plan choice before provisioning. |
| Sonia with Fatima/Tanu | Choose the marketing service/list owner, first newsletter content, eligibility wording, delay/contact limit, review process and retention approach. Confirm whether personalised article recommendations are included in the new permission. |
| Surya | Complete the selected integrations and missing customer flows on Release 2, then prove actual receipt, replies, Excel if selected, unsubscribe cancellation and retry/deduplication using designated test recipients. |

Start with one hosted enquiry reaching the team, its agreed Excel destination
and a customer receipt. Then run one reviewed newsletter and one personalised
scenario with test recipients. Production release and customer campaigns remain
separate decisions. This follows `docs/hosted-staging-setup-2026-09-14.md`,
`docs/zoho-lead-delivery.md` and `docs/releases.md`.

## Copy/paste message for Sonia

Subject: Website emails and access needed

Hi Sonia,

The personalised follow-up I'd suggest is: someone verifies their email, agrees
to personalised updates and interest tracking, then browses or saves properties. After 48 hours without further
activity, we could send matching properties and relevant articles where their
permission covers both, limited to once a week. Those timings need your agreement.

Every marketing email would have an unsubscribe link. We'd also pause automated
follow-ups while an adviser is actively handling their enquiry.

For AskHaus, we'd use only preferences the person confirms for follow-ups, not
their conversation. Anonymous visits would never trigger an email; GA4 measures
website activity separately.

I'd also add an enquiry confirmation followed by the team's reply, and newsletter
emails carrying Fatima's approved articles and PDF links.

The code already uses Resend for account/careers emails and has an optional
ZeptoMail route for staff enquiry notifications. Personalised sending is still
unbuilt, and live delivery hasn't been verified. Mailchimp is a possible campaign
service, not a selected account. Reusing Resend for enquiry emails is also a proposal.

To move this forward, please help confirm:

- Deb: access to the hosted test website and separate test database.
- Sonia: who monitors info@hausofestate.com, who replies, and who approves
  newsletter content and follow-up timings.
- Email owner: any existing transactional and campaign accounts, plus who
  manages the verified sender/domain.
- If Excel is still required: the workbook link and Microsoft setup owner. The
  current Power Automate option covers Excel and the team notification;
  ZeptoMail alone doesn't update Excel.
- Analytics owner: the GTM container ID (`GTM-...`), GA4 measurement ID (`G-...`),
  and access to company Tag Manager and Analytics—GTM Edit and GA4 Editor, with
  Deb retaining publishing control.
- Separately: access to the company's Google Search Console property. These
  are separate from Google Cloud access.

I'll first prove the journeys with our test addresses before anything goes to
customers.

Thanks,
Surya
