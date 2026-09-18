# Saved content

This branch adds account-synchronised property hearts and article bookmarks.
The feature is disabled unless `SAVED_CONTENT_ENABLED=true`.

## Behaviour

- Signed-out visitors can save published Sanity content in versioned browser
  storage. No account or marketing consent is created.
- After sign-in, valid local saves are idempotently merged into the current
  account. Retryable failures stay local; permanently missing or unpublished
  items are discarded. Transient failures retry with a bounded backoff during
  the same browser session.
- Signed-in saves are scoped exclusively to the authenticated user. API input
  never accepts a user ID.
- PostgreSQL stores only the content type and immutable Sanity document ID.
  `/saved` rehydrates each item from the current published Sanity dataset, so
  archived or deleted content is not displayed.
- Property controls use hearts, article controls use bookmarks, and every
  control has a 44px target, pressed state, and live success/error feedback.

## Interface

`GET /api/saved` returns the signed-in user's currently published items.
An optional `contentType=PROPERTY|ARTICLE` filter is supported.

`PUT /api/saved` idempotently saves one published item. `DELETE /api/saved`
idempotently removes it. Both mutation bodies contain only:

```json
{
  "contentType": "PROPERTY",
  "sanityDocumentId": "property-document-id"
}
```

Mutation requests require the same origin. Disabled routes return `404`, an
absent session returns `401`, invalid input returns `400`, and infrastructure
failures return a generic `503` without logging content or account details.

## Rollout

This branch is stacked on `suryak02/auth-hardening`. Apply auth hardening first.
Do not run the migration against production from a developer machine.

Follow `prisma/migrations/README.md`: back up and compare Railway's live schema,
then approve `20260901002000_saved_content` with the exact checksum printed by
the fail-closed pre-deploy gate. Remove the approval value after deployment.

Before enabling the flag in staging:

1. Verify anonymous saves merge into the correct account after login.
2. Verify a second account cannot read, remove, or forge the first account's saves.
3. Archive a test Sanity property and confirm it disappears from `/saved`.
4. Confirm hearts/bookmarks work on desktop and mobile without opening cards.
5. Confirm disabling the flag hides controls and makes `/saved` and its API unavailable.

No Railway database migration or authenticated staging test has been performed
from this local branch. Those remain deployment gates.
