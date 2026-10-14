# Sanity Editorial Workflow

## Purpose

Haus should use the Sanity Studio embedded in the website at `/studio` as its single content dashboard. It owns property, article, careers, team, FAQ, testimonial, culture and social-campaign content. PostgreSQL remains responsible for transactional application data such as users and leads.

This workflow is additive and disabled by default where it introduces a new capability. It does not change production data, grant Sanity access or publish to a social network by itself.

## One Canonical Studio

The root Next.js application and its `sanity.config.ts` are the canonical Studio implementation. Editors should access the Studio through the deployed Haus site, using a company-owned Sanity account.

The repository also contains `studio-haus-of-estate/`, an older standalone configuration with its own dependency tree. Do not remove, deploy or update that directory as part of this work. Deb or the current infrastructure owner must first confirm that no live deployment, CI job, hosting project, editor bookmark or external integration still depends on it. Once that confirmation is recorded, retire it in a separate cleanup PR with its own deployment verification and rollback plan.

## Environments

Use separate datasets for editorial testing and live content:

| Environment | Dataset | Purpose |
| --- | --- | --- |
| Local and staging site | `staging` | Schema changes, previews, workflow rehearsals and backfill tests |
| Production site | `production` | Approved public content only |

The dataset is selected through `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`; it must not be assumed in operational scripts. A Haus Sanity administrator should create the staging dataset and copy only the content needed for testing. Do not copy production secrets or user data into it.

Before staging work begins, Haus should configure exact CORS origins for:

- The local development origin used by the team, such as `http://localhost:3000`.
- The approved staging domain.
- The production domain.

Use exact HTTPS origins in hosted environments and remove obsolete origins. Avoid wildcard origins. Enable credentialed requests only for the origins that require Studio or preview access.

## Access And Secrets

Use named company accounts and least-privilege roles:

| Role | Expected access |
| --- | --- |
| Administrator | Project settings, datasets, tokens, CORS, webhooks and emergency recovery |
| Editor | Create and edit content; publish only if Haus explicitly assigns this responsibility |
| Reviewer/publisher | Review, approve and publish content according to the workflow below |
| Developer | Schema and preview work in staging; no routine production content changes |

Do not share a personal login or a long-lived token over chat or email. Record ownership and recovery details in Haus's password manager or access register.

Runtime configuration uses:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: public Sanity project identifier.
- `NEXT_PUBLIC_SANITY_DATASET`: environment-specific dataset name.
- `SANITY_STUDIO_DATASET`: explicit embedded Studio and CLI target. It defaults to `staging`; production editing must be configured deliberately.
- `SANITY_API_READ_TOKEN`: server-side Viewer token for authenticated draft queries. It must have no mutation permission.
- `SANITY_API_BROWSER_TOKEN`: separate Viewer-only token that `next-sanity` deliberately sends to authenticated preview browsers for live updates. Treat it as browser-visible, grant no mutation permission and rotate it independently.
- `SANITY_REVALIDATE_SECRET`: strong random secret used to verify Sanity webhook signatures.
- `NEXT_PUBLIC_SITE_URL`: the exact site origin used by preview routing.
- `NEXT_PUBLIC_SANITY_SOCIAL_CAMPAIGNS_ENABLED=false`: keeps the social-campaign desk hidden until the workflow is approved.

A write token is not a website runtime dependency. `SANITY_WRITE_TOKEN` should be created only for an approved, time-bounded operation, scoped as narrowly as Sanity permits, and revoked immediately afterwards.

## Draft Preview

The Studio Presentation view enables Next.js Draft Mode through the signed preview endpoint. Initial draft reads use the server Viewer token. Live updates use the separate browser-visible Viewer token only inside an authenticated preview session, and exiting preview disables the Draft Mode cookie.

Preview is for editorial verification, not public publication. Test it with a non-production account and confirm all of the following before granting broader access:

1. An editor can open a property, article or careers document and reach the matching staging page.
2. An unpublished change appears only in an authenticated preview session.
3. Exiting preview returns the page to published content.
4. A visitor without a preview session cannot read drafts.

Current limitations:

- Draft preview is reliable only for server-rendered routes that use the shared Sanity live-query wrapper. Older client-side or custom fetchers may continue to show published data.
- Stega overlays and click-to-edit annotations are intentionally disabled until metadata, URL and comparison code has been audited for encoded values.
- Preview does not replace responsive, accessibility or production-build QA.

Do not enable a write-capable browser token to work around a preview issue.

## Signed Revalidation Webhook

Create a Sanity webhook for create, update and delete events on public content types. Point it to:

```text
https://<approved-site-origin>/api/revalidate/path
```

Configure the webhook with the same signing secret stored as `SANITY_REVALIDATE_SECRET` on the website. The request should contain only the document identity, type and current/previous slug fields required by the route mapper. The application maps those fields to an allowlisted set of Haus paths; Sanity must not be allowed to submit an arbitrary path to revalidate.

Use this webhook projection so slug changes and deletes can invalidate both the old and new page:

```groq
{
  "_id": coalesce(_id, delta::before()._id),
  "_type": coalesce(_type, delta::before()._type),
  "slug": slug.current,
  "previousSlug": delta::before().slug.current
}
```

Recommended setup sequence:

1. Create a separate webhook for staging and verify its signature-failure behavior first.
2. Test create, slug change, publish, archive and delete events for an article and a property.
3. Confirm both detail and listing pages update.
4. Inspect logs for status and document identifiers only; do not log unpublished content.
5. Add the production webhook only after staging passes, then rotate any secret exposed during setup.

An absent webhook secret must fail closed. A webhook failure must not make draft content public; it may leave cached published content stale until the next successful revalidation.

## Publication Lifecycle

The document workflow is:

1. **Draft**: the author prepares content and completes required taxonomy, pricing, availability, rights and accessibility fields.
2. **In review**: the author stops making structural changes and assigns a reviewer.
3. **Approved**: the reviewer verifies facts, links, imagery rights, SEO fields and the staging preview.
4. **Published**: an authorised publisher selects the workflow's Published status and uses Sanity's native Publish action. Public queries must require the published workflow status as well as a published Sanity document.
5. **Archived**: the owner removes expired content from discovery, records why, and checks redirects or replacements where appropriate.

The custom status and Sanity's native draft/published state serve different purposes; both must be correct. Setting a field to Published without using Sanity's Publish action does not release a draft. The Studio disables native Publish for articles and properties until the status is Published and both content/factual and SEO/tracking approvals have an approver and timestamp. Public queries also exclude any native-published document whose workflow state is not Published.

For property content, Marketing must verify structured price/currency, availability, listing state and verification evidence before publishing. Legacy display-price fields stay in place until the structured fields have been backfilled and the frontend migration has been separately approved.

## Social Publishing Packs

The `socialCampaign` document is a human-approved preparation pack. It references a canonical Haus property or published post (including newsletter material represented as a post), stores platform-specific copy and assets, records usage rights and approval, and keeps the final remote post URLs after a human publishes them.

Initial process:

1. Select the canonical Haus content and campaign name.
2. Prepare adapted copy for each selected platform rather than duplicating a full article.
3. Check image/video rights, alt text, claims, links and UTM campaign naming.
4. Have an assigned reviewer approve the pack.
5. A channel owner publishes it manually in the platform's own interface.
6. Record the resulting remote URL and publication date in Sanity.

No platform token is stored in Sanity, and this phase does not call LinkedIn, Meta, X, YouTube or Pinterest APIs. The social-campaign feature flag hides its desk and new-document templates until Sonia approves the content process and Haus confirms ownership of the relevant social accounts; the schema remains registered so disabling the flag never makes existing records unreadable. API automation is a separate security and permissions project.

## Taxonomy Backfill

`scripts/backfill-property-taxonomy.js` is read-only by default. It reads the configured project and dataset, then reports only fields that are absent. It uses `setIfMissing` in apply mode and does not replace an editor's existing value.

Example dry-run:

```powershell
$env:NEXT_PUBLIC_SANITY_PROJECT_ID = "<haus-project-id>"
$env:NEXT_PUBLIC_SANITY_DATASET = "staging"
$env:SANITY_API_READ_TOKEN = "<viewer-token>" # only for a private dataset
node scripts/backfill-property-taxonomy.js
```

Apply to staging only after reviewing the dry-run:

```powershell
$env:SANITY_WRITE_TOKEN = "<temporary-write-token>"
node scripts/backfill-property-taxonomy.js --apply
```

Production requires an explicit second gate:

```powershell
$env:NEXT_PUBLIC_SANITY_DATASET = "production"
node scripts/backfill-property-taxonomy.js --apply --confirm-production
```

Do not run the production command until all of these are complete:

1. Export or otherwise back up the production dataset and verify that the backup can be located.
2. Compare the live schema and document IDs/counts with the expected project.
3. Have Tanu or the responsible content owner approve every proposed taxonomy value.
4. Run and verify the same mutation against staging.
5. Run a production dry-run and save its output in the change record.
6. Obtain Deb's production approval and schedule a monitored change window.
7. Apply once, spot-check the affected documents and public pages, then revoke the write token.

The two document IDs and values in the script are business assumptions, not authoritative production truth. A successful command does not replace content-owner review.

## Launch Checklist

- [ ] Haus confirms the Sanity project owner and at least two recovery administrators.
- [ ] Company-owned accounts and least-privilege roles are assigned.
- [ ] A staging dataset and exact local/staging/production CORS origins exist.
- [ ] Preview Viewer token, revalidation secret and site URL are set in staging.
- [ ] Draft isolation, exit-preview and signed webhook tests pass in staging.
- [ ] The publication lifecycle and responsible reviewer/publisher are approved.
- [ ] Taxonomy and structured property fields are reviewed and backfilled in staging.
- [ ] Sonia approves the social-pack wording/process before its feature flag is enabled.
- [ ] Production is backed up and Deb approves any production backfill or environment change.
- [ ] The owner confirms whether `studio-haus-of-estate/` is unused before a separate removal PR.

## External Haus Dependencies

The repository cannot complete these items on its own:

- Sanity organisation/project ownership, paid-plan capabilities and administrator access.
- Invitations and role assignments for Fatima, Tanu, Sonia, Deb and other named content owners.
- Creation of the staging dataset and any approved production-to-staging content copy.
- Deployment access for environment variables, CORS origins and webhook secrets.
- A production backup, live-dataset comparison and explicit approval for mutations.
- Content-owner decisions for incomplete taxonomy, prices, currencies, availability and verification evidence.
- Confirmation that the standalone Studio is not used anywhere.
- Social-account ownership, platform applications, API permissions and legal approval for later automation.

Until those dependencies are supplied and the checklist is signed off, keep new editorial and social capabilities disabled in production.
