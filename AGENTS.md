<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Release branches and ongoing work

- Cloud handoff exception, 6 November 2026: this checkout is the isolated
  `suryak02/claude-cloud-handoff` export prepared for Surya's portable Claude
  continuation. It preserves the public Release 2 base and reviewed application
  changes while excluding private local correspondence and held recruitment data.
  Continue this cloud session here; do not switch to or overwrite the canonical
  Release 2 checkout. Read `docs/claude-cloud/README.md` and
  `docs/claude-cloud/EXPORT.md`.
  This is one coherent cloud handoff, not permission to create per-feature
  branches or release to production. The historical release guidance below
  describes the original work and remains relevant to later integration.

- Release 1 / PR #15 was merged into `main` at `20afdeeb` and deployed on 18 September 2026. The remote `suryak02/technical-seo-fixes` branch is retired; do not recreate it. Its SEO/consent implementation is live, but real analytics collection is not yet verified.
- Release 2 is `suryak02/azizi-florence-content-scaffold`: the cumulative website overhaul, Florence, standalone Sanity setup, and subsequent personalised follow-up milestone. Continue review in draft PR #16 against `main`; closed PR #12 preserves the earlier history.
- Continue all subsequent feature work on the existing Release 2 branch. Do not create a branch per feature or revive the superseded feature branches. Create a new branch only when Surya explicitly requests it.
- Release 2 must retain the Release 1 changes. Commit in reviewable increments on that same branch.
- The explicit 18 September exception is complete: Sonia's urgent careers closure and approved contacts shipped through Release 1 / PR #15 and were retained in Release 2. The overhaul remains separate in PR #16.
- Explicit 22 September reopening: Surya approved the nine replacement careers titles in `content/careers-roles.json`, including Social Media Account Manager (Intern), for Release 2. Only those routes and their discovery links reopen; retired and unknown jobs remain unavailable. Keep `CAREERS_INTAKE_ENABLED=false` until hosted delivery and actual recruiter inbox receipt are verified. The 18 September closure remains the deployed Release 1 position until a separate release. See `docs/website-update-2026-09-22.md`.
- Do not push directly to `main`, deploy production, publish Sanity content, or send customer campaigns as part of preparing a release.
- Explicit 21 September content correction: Surya directly requested removing the misleading completed status from Al Furjan and Azizi Monaco Mansions. Their published records were patched narrowly to off-plan, with matching copy and sale filters; existing drafts were preserved. This does not approve publishing Florence, Cardiff, blog covers or any other held content. See `docs/property-status-correction-2026-09-21.md` for the receipt and live checks.
- The standalone Studio is a sibling of the canonical app (`../studio-haus-of-estate`), with project `jdxbkry4` / dataset `production`. Reuse the app's current schema source; preserve existing documents and the accepted Florence format.
- Preserve uncommitted handoffs and local assets. Worktrees are working copies, not new feature branches.
- See `docs/releases.md` for release ownership, verification and pending service access.
