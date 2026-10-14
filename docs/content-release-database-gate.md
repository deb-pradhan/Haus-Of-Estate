# Database preparation for website releases

Railway runs `npm run db:prepare-release` before starting the website. With
`AUTH_ENABLED=false`, `LEAD_INTAKE_ENABLED=false` and
`LEAD_DELIVERY_ENABLED=false`, it skips database access and migrations. This
allows a content release without a database connection. Email-only careers
does not require a database; its separate sender and hosted-delivery checks
still apply.

If any database-backed feature is enabled, the wrapper runs the unchanged
`npm run db:migrate:approved` command and preserves its exit status. A missing
database, divergent migration history or missing checksum-bound approval still
blocks that release. Complete the existing backup, schema comparison and
approval process before enabling those features. This wrapper does not enable
features or approve migrations.

The wrapper deliberately matches runtime parsing: auth requires exact `true`,
lead intake accepts case-insensitive `true`, and lead delivery accepts trimmed,
case-insensitive `true`. Use explicit lowercase `false` for the disabled release.
Saved content and AskHaus also remain unavailable while auth is disabled.

Verify without database access or real migrations using
`node --test scripts/prepare-release-database.test.mjs`.
