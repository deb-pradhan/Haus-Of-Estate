# Resend setup and the brochure follow-up

Account setup does not activate the website workflow. This note describes the next milestone, separate from the focused Florence release.

## Account and hosting setup

1. Add **hausofestate.com** in Resend and copy the exact DNS records from its dashboard. Verify the domain. Existing Release 2 sender validation expects that exact domain; using a sending subdomain requires a deliberate code/configuration change. Preserve the existing company inbox MX routing. Resend receiving is not required. See [domain setup](https://resend.com/docs/add-a-domain) and [MX conflicts](https://resend.com/docs/knowledge-base/how-do-i-avoid-conflicting-with-my-mx-records).
2. Create a **Sending access** API key restricted to the verified domain. Save it directly into the deployment host's server environment, never source control, a public build variable or a chat message. See [key permissions](https://resend.com/docs/api-reference/api-keys/create-api-key).
3. Confirm a real monitored team inbox and configure the relevant server settings when the delivery implementation is ready:

   ```dotenv
   RESEND_API_KEY=<private key stored in Railway>
   RESEND_FROM_EMAIL=noreply@hausofestate.com
   LEAD_DELIVERY_PROVIDER=resend
   LEAD_NOTIFICATION_TO=<confirmed monitored @hausofestate.com inbox>
   ```

   The sender setting takes a bare address; code supplies the display name. The new lead transport's recipient is distinct from older `ADMIN_EMAIL`, `CAREERS_EMAIL` and `AUTH_EMAIL_FROM` settings.
4. Leave delivery disabled until a controlled test proves database acceptance, one Sheet row, actual staff/customer inbox receipt and duplicate-safe retry. Inspect pending delivery events before enabling notifications so a backlog is not accidentally released. The separate selected-updates worktree supports `LEAD_NOTIFICATIONS_ENABLED=false`; PR #16's older `LEAD_DELIVERY_ENABLED` switch does not make the same separation. Reconcile the release being activated.

## Intended journey and current boundary

| Step | Existing work / remaining task |
|---|---|
| Save an enquiry | Release 2 has shared durable intake and separate consent purposes. The focused Florence PR keeps main's existing email enquiry links. Native intake/Sheets is a separate selected update. |
| Send the requested brochure | **Still to build:** approved property-to-brochure mapping, private file/link policy, independent queued customer delivery, template, retries and delivery records. |
| Notify the team | Release 2 has a Resend staff-notification transport. Actual hosted delivery/inbox receipt remains to be verified. |
| Assign follow-up | Decide the responsible person and response process. Existing Sheet export leaves owner blank and status New. |
| Send later marketing | Requires separately selected marketing consent, unsubscribe/suppression handling, cancellation of queued messages and tested scheduling. Not enabled by a brochure request. |

The customer should request a brochure for the collection they are viewing; the selected design can be saved as interest context. Supplied sources currently provide one PDF per villa bedroom collection and a combined 3-/4-bedroom townhouse PDF, not a separate PDF for every design.

Prefer an approved download link in the email. The original large Florence brochure cannot be attached: Resend limits the whole encoded message to 40 MB. See [attachment limits](https://resend.com/docs/dashboard/emails/attachments). The server must resolve the approved brochure from a property identity, rather than trusting a customer-supplied PDF URL.

Receiving a requested brochure and agreeing to later marketing are different purposes. Brochure fulfilment should work without marketing opt-in. Resend handles email; Google Sheets is the team tracker and the database/delivery jobs provide reliable acceptance and retries. Retell is a separate voice feature and is not needed to send brochures.

Before activation, confirm: approved PDF revisions and recipients, sender/reply-to, monitored staff inbox, named owner, deployed intake/database/worker configuration, and one end-to-end controlled receipt. Never display “brochure sent” solely because an enquiry was saved.
