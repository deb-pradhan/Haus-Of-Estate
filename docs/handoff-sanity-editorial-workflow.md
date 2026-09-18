# Paste-Ready Handoff: Sanity Editorial Workflow

Hi team,

I have prepared the Sanity editorial-workflow foundation for review. The embedded `/studio` in the Haus website is the intended single content dashboard; I have not removed or changed the older `studio-haus-of-estate/` directory because we first need confirmation that no deployment or editor still uses it.

The proposed flow is Draft -> In review -> Approved -> Published -> Archived. Publication requires both the correct workflow status and Sanity's native Publish action. The implementation also prepares authenticated draft preview, signed document-aware revalidation, additive property taxonomy/pricing/verification fields, and a disabled human-approved social-campaign pack. It does not publish to social platforms automatically.

The property taxonomy helper is now dry-run by default. It reads the configured project/dataset and will not write unless `--apply` is supplied. Production additionally requires `--confirm-production`. No production backfill has been run.

To finish staging setup, I need Haus to provide or confirm:

- The company-owned Sanity project administrator and editor/reviewer role assignments.
- A `staging` dataset and approved local, staging and production CORS origins.
- Staging deployment access for separate server and browser-safe Viewer-only preview tokens plus a signed webhook secret.
- The content owner who will approve taxonomy, structured price/currency, availability and verification fields.
- Sonia's approval for the manual social publishing-pack process.
- Deb's approval, a backup and a live-data comparison before any production mutation.
- Written confirmation that `studio-haus-of-estate/` is unused before it is removed in a separate PR.

Current preview limitation: server-rendered pages using the shared Sanity live query can show drafts, while older client-side/custom fetchers may still show published data. Click-to-edit annotations remain intentionally disabled pending a separate audit.

The full setup, safeguards and launch checklist are documented in `docs/sanity-editorial-workflow.md`.
