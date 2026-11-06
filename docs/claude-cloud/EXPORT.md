# Sanitized cloud continuation export

Prepared 6 November 2026 for a development preview, not a production release.

## Source and preservation

The isolated `suryak02/claude-cloud-handoff` branch starts at the already-published
Release 2 tip `53d1f1c5f5e2c3e52cb08c92a4f180b12e6b97ef`. The working tree contains
an aggregate export of selected code through local Release 2 snapshot
`3b895b157922f09d1c74a7f82c0b358b97db15cc`. The twelve local source commits were
not cherry-picked, merged or rewritten. Their ancestry and private context remain
in the original local checkout. The export does not integrate current `main` or
claim that the entire cumulative release is ready to merge.

The aggregate code export changes 100 files, with 790,054 bytes of resulting
file content before these cloud briefing documents and fixtures are added. Its
largest changed file is approximately 50 KB. No original property packages,
brochures, images, local environment files or credentials were copied.

## Included code

- Native brochure request contract, matching private catalogue and download
  checks, email renderer, outbox transport, webhook receipt handling and tests.
- Mobile property/design selection and simulated brochure form/email journey.
- Homepage area filtering, catalogue navigation and combined property/article
  search improvements.
- Generic careers email-only contact and fixed recipient policy. Existing public
  role policy remains intact; this export does not approve additional vacancies.
- Database schema/migration definitions and diagnostic scripts as source only.
  No migration, worker, provider call or delivery activation was executed.

## Deliberate exclusions

Historical private handoffs, meeting summaries, personal budget notes, mailbox
receipt identifiers and unpublished recruitment content were excluded. The
private recruitment preview and its content-dependent tests were also excluded.
The shared contact helper and tests were adjusted to avoid referencing that
absent preview or importing the held data. There are no remaining references to
that private working-list file or route in the exported source and tests.

The cloud README, goal and fixtures are supplied separately as sanitized context.
Existing historical repository documentation may describe earlier states; use
the cloud README and verify current code before acting.

## Verification performed on this export

- `npm run typecheck`: passed.
- Seven focused Vitest files for careers policy/contact rendering, local brochure
  demonstration and property search: 52 tests passed.
- Five further Vitest files for private brochure catalogue/transport, sales
  routing, readiness and client retries: 52 tests passed.
- `node --import tsx --test scripts/check-brochure-email-setup.test.mjs scripts/run-brochure-demo.test.mjs scripts/run-lead-browser-server.test.mjs`:
  20 tests passed.
- `git diff --check`: passed.
- Scoped ESLint for the three source/test files adjusted during pruning: passed.
- Targeted scans of the export found no private mailbox identifiers, personal
  email addresses, private-key headers or common credential token patterns. This
  is a targeted check, not a full security audit.

Use the documented `--import tsx` loader for the diagnostic Node tests. Initial
attempts using plain Node and strip-only TypeScript failed to load the imported
TypeScript syntax; the correctly configured command above passed.

These checks used Node 22.14.0 and a local junction to an existing root dependency
installation. They are not evidence of a fresh Linux/cloud installation, a
production build, browser verification, hosted database writes or email receipt.
The inherited legacy Studio dependency tree was not changed. A cloud session must
install the root dependencies normally and run client generation without database
migrations. No production credentials are needed for the fixture concept.
