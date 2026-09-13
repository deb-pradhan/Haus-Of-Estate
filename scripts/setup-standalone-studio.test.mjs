import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import test from 'node:test'

import { setupStandaloneStudio } from './setup-standalone-studio.mjs'

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'haus-studio-setup-'))
  t.after(async () => {
    const cleanupPath = await realpath(directory)
    assert.equal(dirname(cleanupPath), await realpath(tmpdir()))
    assert.ok(basename(cleanupPath).startsWith('haus-studio-setup-'))
    await rm(cleanupPath, { recursive: true, force: true })
  })
  const app = join(directory, 'Haus App')
  const target = join(directory, 'studio-haus-of-estate')
  await mkdir(join(app, 'src/sanity/schemaTypes'), { recursive: true })
  await writeFile(join(app, 'package.json'), JSON.stringify({ dependencies: { next: '16.3.4', sanity: '6.9.2' } }))
  for (const name of ['schemaTypes/index.ts', 'presentation.ts', 'structure.ts', 'workflow-actions.tsx']) {
    await writeFile(join(app, 'src/sanity', name), '')
  }
  return { directory, app, target }
}

test('creates one sibling with shared schema imports and is idempotent', async (t) => {
  const { app, target } = await fixture(t)
  const first = await setupStandaloneStudio({ appPath: app })
  assert.equal(first.target, target)
  assert.equal(first.changes.length, 8)
  const config = await readFile(join(target, 'sanity.config.ts'), 'utf8')
  assert.match(config, /\.\.\/Haus App\/src\/sanity\/schemaTypes/)
  assert.match(config, /dataset: 'production'/)
  assert.match(config, /projectId: 'jdxbkry4'/)
  const second = await setupStandaloneStudio({ appPath: app })
  assert.deepEqual(second.changes, [])
  assert.equal(second.unchanged.length, 8)
})

test('linked worktrees require an explicit app path before any setup', async (t) => {
  const { app, target } = await fixture(t)
  await writeFile(join(app, '.git'), 'gitdir: /existing/worktree')
  await assert.rejects(setupStandaloneStudio({ sourceRoot: app }), /linked Git worktree/)
  await assert.rejects(readFile(join(target, 'package.json')), { code: 'ENOENT' })
  await assert.rejects(setupStandaloneStudio({ sourceRoot: app, appPath: app }), /canonical app checkout/)
  const canonical = await fixture(t)
  assert.equal((await setupStandaloneStudio({ sourceRoot: app, appPath: canonical.app })).changes.length, 8)
})

test('preflights conflicts before writing even previously missing files', async (t) => {
  const { app, target } = await fixture(t)
  await mkdir(target)
  await writeFile(join(target, 'sanity.config.ts'), 'user configuration')
  await assert.rejects(setupStandaloneStudio({ appPath: app }), /No files changed/)
  assert.equal(await readFile(join(target, 'sanity.config.ts'), 'utf8'), 'user configuration')
  await assert.rejects(readFile(join(target, 'package.json')), { code: 'ENOENT' })
})

test('explicit overwrite replaces managed config while retaining settings and unrelated files', async (t) => {
  const { app, target } = await fixture(t)
  await mkdir(target)
  await writeFile(join(target, 'sanity.config.ts'), 'old configuration')
  await writeFile(join(target, '.env.local'), 'SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:4000')
  await writeFile(join(target, 'editor-notes.txt'), 'keep this')
  const result = await setupStandaloneStudio({ appPath: app, overwrite: true })
  assert.deepEqual(result.conflicts, ['sanity.config.ts'])
  assert.equal(await readFile(join(target, 'editor-notes.txt'), 'utf8'), 'keep this')
  assert.equal(await readFile(join(target, '.env.local'), 'utf8'), 'SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:4000')
})

test('check reports missing or different files without creating or overwriting anything', async (t) => {
  const { app, target } = await fixture(t)
  assert.equal((await setupStandaloneStudio({ appPath: app, check: true })).changes.length, 8)
  await assert.rejects(readFile(join(target, 'package.json')), { code: 'ENOENT' })
  await mkdir(target)
  await writeFile(join(target, 'sanity.config.ts'), 'user configuration')
  const result = await setupStandaloneStudio({ appPath: app, check: true })
  assert.deepEqual(result.conflicts, ['sanity.config.ts'])
  assert.equal(await readFile(join(target, 'sanity.config.ts'), 'utf8'), 'user configuration')
})

test('rejects a Studio directory junction even when overwrite was requested', async (t) => {
  const { app, target, directory } = await fixture(t)
  const elsewhere = join(directory, 'unrelated')
  await mkdir(elsewhere)
  await symlink(elsewhere, target, 'junction')
  await assert.rejects(setupStandaloneStudio({ appPath: app, overwrite: true }), /symlink, or junction/)
  await assert.rejects(readFile(join(elsewhere, 'package.json')), { code: 'ENOENT' })
})
