# Personal ChatGPT handoff: purchase-readiness prototype

## Current task

Haus asked for an escrow-style payment direction to be explored. The implementation deliberately stops before payment collection: it is an educational, disabled-by-default purchase-readiness experience on sale property pages.

## Branch and review boundary

- Branch: `suryak02/purchase-readiness-prototype`
- Base: `suryak02/lead-intake-foundation`
- Feature flag: server-only `PURCHASE_READINESS_ENABLED`, default `false`
- This branch must never be pushed or merged directly into `main`.

## What is implemented

- A market-aware five-step guide for Dubai off-plan, Dubai ready property, the wider UAE, the UK, Bali, Cyprus, and a conservative international fallback.
- Clear wording that Haus does not take, hold, or forward client funds.
- Dubai off-plan guidance directs users only toward a verified, project-specific approved escrow arrangement.
- UK guidance points users toward independently confirmed solicitor or conveyancer instructions.
- The final action opens the existing lead form with the current published property context.
- The UI contains no payment button, card/bank/passport fields, payment API, transaction model, or provider integration.
- Historical property documents without `listingType` are treated as sale pages; only an explicit rent-only listing is excluded until the Sanity taxonomy backfill is complete.

## Review and launch gates

- Keep the flag disabled until Sonia approves the wording and Haus obtains legal/privacy review for every active market.
- Confirm the property taxonomy remains accurate in Sanity because market and off-plan status select the wording.
- Do not turn this prototype into a deposit flow without a separately approved regulated-provider architecture and legal review.

## Verification scope

- Unit tests cover market resolution, Dubai off-plan escrow wording, sale-only visibility, and the disabled flag.
- Browser tests cover the five-step experience, property-context enquiry handoff, absence of a payment action/request, and mobile overflow.
