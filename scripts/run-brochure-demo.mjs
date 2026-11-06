import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { leadBrowserEnvironment } from './run-lead-browser-server.mjs'

const workspace = fileURLToPath(new URL('../', import.meta.url))

export function brochureDemoEnvironment(bundle, inherited = process.env, dotenvSources = []) {
  if (!isAbsolute(bundle)) throw new Error('Provide the absolute prepared Florence bundle directory.')
  return {
    ...leadBrowserEnvironment('build', inherited, dotenvSources),
    NODE_ENV: 'development',
    HAUS_NEXT_DIST_DIR: '.next-brochure-demo',
    HAUS_PROPERTY_PREVIEW_DIR: bundle,
    HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW: 'true',
    HAUS_BROCHURE_DEMO_ENABLED: 'true',
    NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3017',
    SITE_URL: 'http://127.0.0.1:3017',
    LEAD_INTAKE_ENABLED: 'false',
    LEAD_DELIVERY_ENABLED: 'false',
    LEAD_NOTIFICATIONS_ENABLED: 'false',
    BROCHURE_EMAIL_ENABLED: 'false',
    LEAD_SHEETS_ENABLED: 'false',
    DATABASE_URL: '',
    BROCHURE_FILES_ROOT: '',
    BROCHURE_CATALOG_PATH: '',
    BROCHURE_LINK_SECRET: '',
  }
}

async function main() {
  const bundle = process.argv[2]
  if (!bundle) throw new Error('Usage: node scripts/run-brochure-demo.mjs <absolute-prepared-bundle>')
  const sources = await Promise.all([
    '.env', '.env.local', '.env.development', '.env.development.local',
  ].map((name) => readFile(resolve(workspace, name), 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return ''
    throw error
  })))
  console.info('Local demonstration: prepared drafts visible in the local catalogue; real intake and all outbound delivery disabled; no service credentials.')
  const child = spawn(process.execPath, [
    resolve(workspace, 'node_modules/next/dist/bin/next'),
    'dev', '--hostname', '127.0.0.1', '--port', '3017',
  ], { cwd: workspace, env: brochureDemoEnvironment(bundle, process.env, sources), stdio: 'inherit', windowsHide: true })
  process.once('SIGINT', () => child.kill('SIGTERM'))
  process.once('SIGTERM', () => child.kill('SIGTERM'))
  child.once('error', (error) => { console.error(error.message); process.exitCode = 1 })
  child.once('exit', (code) => { process.exitCode = code ?? 1 })
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main()
}
