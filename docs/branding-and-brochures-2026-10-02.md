# Branding and property brochures — 2 October 2026

Surya relayed Sonia's request for a smaller, white PolicyBee badge. The footer now uses the supplied white PNG unchanged at 96 × 96 CSS pixels, reduced from 128 × 128. Source SHA-256: `c5e949acec0c41f053e47df0932e06d75e2aacf941e08b0bb46b782bcf8ec43a`. Browser review confirmed the new image loads at the intended size. The earlier dark asset is preserved; it is no longer used by the footer.

Surya identified Appollo and Poppins as the intended brand fonts and mentioned a new Haus logo, but confirmed that the logo and Appollo files are not available and their heading/body assignments are not yet known. Keep the current typography and Haus logo until the approved assets and usage details arrive. Do not substitute a similarly named font or assume existing logo variants are the new approval.

## Florence hold

Keep Florence variations paused until Haus supplies the individual property brochures and their correspondence to the designs. Preserve the accepted overview and five home-type drafts, their current media assignments and source evidence. Do not infer extra variants, replace the accepted format or publish held content from this update.

## Future brochure request

Haus wants the brochure for the property being enquired about emailed after the visitor submits their details. Record this as a future delivery requirement; no brochure endpoint, email send or publication is enabled here.

- Reuse the existing lead intake receipt, idempotency and database transaction (`src/lib/lead-intake/service.ts`) and server-resolved property identity (`src/lib/lead-intake/project.ts`). Map each approved property/design to its approved brochure and revision once supplied. Never choose a brochure from a client-submitted arbitrary URL.
- Save an explicit brochure request and queue a customer email in the existing durable delivery workflow. The current staff notification transport is not customer brochure fulfilment; add a distinct destination/template and reuse retry handling.
- Keep requested brochure delivery separate from optional newsletter/property-match marketing consent, whose existing choices default to false. Record the visitor's actual choices. Do not silently enrol brochure requesters into ongoing marketing.
- Prefer an approved download link in the email over attaching the large source brochure. Confirm the final PDFs, access requirements and property-to-brochure mapping before implementing the delivery contract.
- Resend is already installed and has existing adapters. Sender/domain setup, database/worker readiness and controlled end-to-end delivery including actual inbox receipt still need verification. Follow `docs/lead-delivery-2026-09-25.md`; local code and the presence of an adapter are not evidence that hosted delivery works.

Changes belong to Release 2 / `suryak02/azizi-florence-content-scaffold`, draft PR #16. No production deployment, Sanity mutation, marketing send or main-branch push is included.
