# Standalone Sanity Studio for Release 2

The local Studio is a separate React application beside the Next.js app:

```text
ChatGPT/
├── Haus-of-Estate/
└── studio-haus-of-estate/
```

It uses the existing **Haus Of Estate** project `jdxbkry4` and **production**
dataset, as explicitly selected in Deb's setup instructions. It imports the
app's property and editorial schemas, navigation, preview locations, and publish
guards directly. Keep the canonical app on the combined Release 2 branch so
the editor uses the latest Florence fields. There is no second schema copy.

## Reproduce the local setup

Use Node.js 22.12 or newer. From the app checkout:

```powershell
node scripts/setup-standalone-studio.mjs --app-path "C:/Users/surya/OneDrive/Documents/ChatGPT/Haus-of-Estate" --install
cd "C:/Users/surya/OneDrive/Documents/ChatGPT/studio-haus-of-estate"
npm.cmd run dev
```

Open [the local Studio](http://localhost:3333) and sign in with the account Deb
invited. Use `localhost`, because the project's existing CORS configuration
accepts that Studio origin; `127.0.0.1:3333` displays a CORS setup prompt.

From the canonical app checkout, `npm.cmd run studio:dev` starts this sibling
Studio. The old embedded development command is retained explicitly as
`studio:embedded:dev`; it is not the default local editing workflow.

The setup command defaults to its own app checkout only for a regular checkout.
In a linked Git/Codex worktree, `--app-path` is required to prevent creating a
Studio beside the worktrees accidentally. The target is always the fixed
`studio-haus-of-estate` sibling of the selected app. It verifies the Next.js app
and shared Sanity source before touching the target.

Setup preflights all eight managed files and stops without writing if any
existing managed file differs. Use `--check` for a read-only comparison. After
reviewing local changes, `--overwrite` explicitly replaces only those managed
files. Other files, including `.env.local`, remain intact; symlinks and junctions
are refused. No existing embedded Studio is removed. `--install` runs local
`npm ci` from the included lockfile; it does not authenticate or access content.

## What is verified, and what needs account access

The separate Studio passed TypeScript, schema validation (zero errors and
warnings), production build, and browser checks on this machine. The browser
renders **Haus Of Estate — Production** with Google, GitHub, and email sign-in
choices, without an error overlay. The public production API responded with
three properties and 25 articles on 13 September 2026. No Florence document was
visible in the public title/slug query; that does not establish whether drafts
exist.

The supplied `npm create sanity@latest` initializer refused to scaffold because
the CLI has no authenticated account. The same standalone local configuration
was prepared using the existing schemas instead. The requested
`sanity-best-practices` skill was installed successfully in the parent workspace.
Use `npx.cmd sanity login` inside the Studio for CLI access. Sign-in and checking
the invited account's editor permissions remain pending.

Nothing in setup imports, publishes, deletes, or updates Sanity documents,
deploys a Studio/schema, or creates a project/dataset. Production content and
Studio deployment remain separate actions.

## Preview and checks

The Next.js app queries the same project/dataset and runs independently at
`http://localhost:3000`. The Studio's Presentation tool uses the existing draft
mode endpoint and editorial workflow. Draft preview needs the app's server-only
Sanity read token and the appropriate CORS configuration. Set
`SANITY_STUDIO_PREVIEW_ORIGIN` in the Studio's untracked `.env.local` to select
another app origin. Never use a `SANITY_STUDIO_*` variable for a secret token.

```powershell
npm.cmd run typecheck
npm.cmd run schema:validate
npm.cmd run build
npm.cmd run typegen
```

TypeGen extracts the shared schema and scans app source, writing generated
files only into the sibling Studio. It currently generates 28 schema types and
no query types: the existing app's plain query strings are not tagged with
`defineQuery`/`groq`. Adopting generated frontend query types is separate from
this working Studio setup. The standalone lockfile pins the verified dependency
tree; update and rebuild it together when upgrading the app's Sanity packages.

The bootstrap's filesystem protection tests use Node's test runner:

```powershell
node --test scripts/setup-standalone-studio.test.mjs
```
