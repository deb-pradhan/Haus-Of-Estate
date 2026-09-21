# Filemail enquiry investigation — 21 September 2026

**Website origin remains unverified.** Two different Filemail transfers were
found in Surya's signed-in Gmail. Neither has been matched to a website lead or
provider delivery record. No transfer files were opened or downloaded.

## Messages reviewed

| Case | Forward and embedded report | Visible transfer details |
| --- | --- | --- |
| Latest | Haus Team forwarded “Fwd: Filemail Report - files awaiting download” on 19 September at 12:17 UK. The embedded Filemail report shows 19 September, 15:16, with no timezone displayed. | Recipient: company info inbox. Sender display name: Angela. Subject: Request For Quotation. Reference: `pDHU3MOZ`. No sender email address or original transfer-sent time was visible. |
| Earlier | HR forwarded the earlier quotation on 12 September. Its embedded Filemail notification is dated 5 September. | Recipient: company HR inbox. Sender display name: Frank Richmond. Reference: `XoovT2EI`. This is a different transfer, sender name and recipient inbox. |

The scoped Gmail search from 1 September for the latest reference and the
quotation/Filemail subjects returned exactly two matching threads. This is a
search result, not proof that no other related messages exist.

The latest embedded report displays `no-reply@filemail.com`, and its visible
download link uses the official Filemail domain/path. These are details in
forwarded content, not authenticated original headers. They do not establish
the transfer sender's identity, the files' legitimacy or website provenance.
The embedded report's time must not be compared directly with the forward's UK
time until its timezone is established. Do not conflate the two transfers.

## Website and backend evidence

The source review used Release 2 `f32b84d6` and saved `origin/main` `20afdeeb`.
Only documentation changed after the 18 September reconciliation merge
`3671f5a1`; no intake or email backend implementation changed.

- No Filemail generator, transfer reference or “Request For Quotation” sender
  was found in the reviewed application source on either branch.
- The legacy staff email uses “New [TIER] Lead: [firstName] ([intent]) — Score:
  [score]” (`src/lib/email/resend.ts`). Release 2's optional ZeptoMail transport
  uses “New Haus of Estate enquiry”, with a lead ID, submission time and delivery
  event reference (`src/lib/lead-delivery/zeptomail.ts`). Neither generates these
  Filemail reports. A different subject does not rule out a related enquiry.
- The main-branch lead route finds an existing lead by email and updates it.
  Correlation must consider `updatedAt`, as well as `createdAt`; the current row
  alone may not reconstruct all previous submissions.
- Local database URLs and Resend, ZeptoMail, Power Automate and hosting tokens
  were absent from the checked local/process configuration; delivery was
  disabled. No relevant local delivery receipts or logs were found. This means
  those services were not accessible for this investigation, not that the
  company has no hosted backend or email account.

## Evidence needed to resolve it

The company info-inbox owner should retrieve the original latest notification's
full headers, Message-ID, sender/Reply-To and received time with timezone, plus
any original transfer-sender details. Use the HR owner for the earlier case if
that investigation is still required. Preserve each transfer reference separately.

Deb or the authorised backend owner should provide scoped read-only access to
the relevant hosted lead records and provider logs. Compare the verified sender
address, request details and time window with lead creation/update timestamps,
then correlate any notification/provider message IDs. A Filemail transfer
reference has no established mapping to a Haus lead ID.

Record a confirmed match, a scoped search with no match, or the remaining access
gap. Do not label either message fraudulent or a confirmed website enquiry from
the current evidence. No email was sent, production record changed or Filemail
payload accessed during this review.
