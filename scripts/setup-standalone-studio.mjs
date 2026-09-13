import { spawn } from 'node:child_process'
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templateRoot = new URL('./standalone-studio/', import.meta.url)
const studioFolder = 'studio-haus-of-estate'
const managedFiles = [
  'package.json', 'package-lock.json', 'sanity.config.ts', 'sanity.cli.ts',
  'tsconfig.json', '.gitignore', '.env.example', 'README.md',
]

async function inspect(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

function templatePath(value) {
  // Templates use single-quoted TypeScript strings. Folder names are data.
  return JSON.stringify(value).slice(1, -1).replaceAll("'", "\\'")
}

/** Prepare only local Studio files. This never calls Sanity's cloud APIs. */
export async function setupStandaloneStudio({
  appPath,
  sourceRoot = repositoryRoot,
  overwrite = false,
  check = false,
} = {}) {
  const sourceGit = await inspect(join(sourceRoot, '.git'))
  if (!appPath && sourceGit?.isFile()) {
    throw new Error('This is a linked Git worktree. Pass --app-path with the canonical app checkout so the Studio is created beside your app, not beside Codex worktrees.')
  }

  const appRoot = await realpath(resolve(appPath || sourceRoot))
  if ((await inspect(join(appRoot, '.git')))?.isFile()) {
    throw new Error('--app-path must select the canonical app checkout, not another linked Git worktree.')
  }
  const appPackage = JSON.parse(await readFile(join(appRoot, 'package.json'), 'utf8'))
  if (!appPackage.dependencies?.next || !appPackage.dependencies?.sanity) {
    throw new Error('--app-path must identify the existing Haus Next.js app with its Sanity dependencies.')
  }
  for (const source of [
    'src/sanity/schemaTypes/index.ts', 'src/sanity/presentation.ts',
    'src/sanity/structure.ts', 'src/sanity/workflow-actions.tsx',
  ]) {
    if (!(await inspect(join(appRoot, source)))?.isFile()) {
      throw new Error(`The app checkout is missing ${source}. Use the consolidated Release 2 checkout.`)
    }
  }

  const parent = dirname(appRoot)
  const target = join(parent, studioFolder)
  if (target === appRoot || dirname(target) !== parent) {
    throw new Error('The Studio must be a separate sibling of the app.')
  }
  const targetInfo = await inspect(target)
  if (targetInfo && (!targetInfo.isDirectory() || targetInfo.isSymbolicLink())) {
    throw new Error(`Refusing to use a file, symlink, or junction as the Studio folder: ${target}`)
  }
  if (targetInfo && await realpath(target) !== target) {
    throw new Error(`The Studio path resolves outside its expected location: ${target}`)
  }

  const appRelative = relative(target, appRoot).split(sep).join('/')
  const changes = []
  const conflicts = []
  const unchanged = []
  for (const name of managedFiles) {
    const expected = (await readFile(new URL(`${name}.template`, templateRoot), 'utf8'))
      .replaceAll('__APP_RELATIVE_PATH__', templatePath(appRelative))
    const destination = join(target, name)
    const entry = await inspect(destination)
    if (entry && (!entry.isFile() || entry.isSymbolicLink())) {
      throw new Error(`Refusing to replace a non-regular file or symlink: ${destination}`)
    }
    const existing = entry ? await readFile(destination, 'utf8') : null
    if (existing === expected) {
      unchanged.push(name)
    } else {
      changes.push({ name, destination, expected, existing })
      if (entry) conflicts.push(name)
    }
  }

  // Finish the entire preflight before creating or overwriting any file.
  if (!check && conflicts.length && !overwrite) {
    throw new Error(`Existing Studio files differ: ${conflicts.join(', ')}. No files changed. Review them first; --overwrite replaces only these managed files. Other files, including .env.local and content, are preserved.`)
  }
  if (!check) {
    await mkdir(target, { recursive: true })
    for (const change of changes) {
      if (change.existing !== null && await readFile(change.destination, 'utf8') !== change.existing) {
        throw new Error(`File changed during setup; refusing to overwrite: ${change.name}`)
      }
      await writeFile(change.destination, change.expected, { flag: change.existing === null ? 'wx' : 'w' })
    }
  }
  return { appRoot, target, changes: changes.map(({ name }) => name), conflicts, unchanged, check }
}

async function installDependencies(target) {
  const dependencyInfo = await inspect(join(target, 'node_modules'))
  if (dependencyInfo && (!dependencyInfo.isDirectory() || dependencyInfo.isSymbolicLink())) {
    throw new Error('Refusing npm ci because the Studio node_modules is a file, symlink, or junction.')
  }
  await new Promise((accept, reject) => {
    // The Windows shell receives only this fixed npm command; paths are passed
    // through cwd, never interpolated into shell text.
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--no-fund', '--no-audit'], {
      cwd: target,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      windowsHide: true,
    })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? accept() : reject(new Error(`npm ci exited with code ${code}`)))
  })
}

function parseArguments(args) {
  const options = {}
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--app-path') {
      const value = args[++index]
      if (!value || value.startsWith('--')) throw new Error('--app-path requires an app directory.')
      options.appPath = value
    } else if (argument === '--check') options.check = true
    else if (argument === '--overwrite') options.overwrite = true
    else if (argument === '--install') options.install = true
    else if (argument === '--help') options.help = true
    else throw new Error(`Unknown option: ${argument}`)
  }
  if (options.check && (options.install || options.overwrite)) {
    throw new Error('--check cannot be combined with --install or --overwrite.')
  }
  return options
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    console.log('Usage: node scripts/setup-standalone-studio.mjs [--app-path <app>] [--check | --overwrite] [--install]')
    console.log('Creates the sibling studio-haus-of-estate using shared Release 2 schemas. --check is read-only; --install runs npm ci locally.')
    return
  }
  const result = await setupStandaloneStudio(options)
  console.log(`App: ${result.appRoot}\nStudio: ${result.target}\nProject: jdxbkry4 / production`)
  if (options.check) {
    console.log(result.changes.length ? `Needs setup: ${result.changes.join(', ')}` : 'Managed Studio files match the Release 2 templates.')
    if (result.changes.length) process.exitCode = 1
    return
  }
  console.log(result.changes.length ? `Prepared: ${result.changes.join(', ')}` : 'Studio files already match; no changes needed.')
  if (options.install) await installDependencies(result.target)
  console.log(`Run npm run dev inside ${basename(result.target)}, then open http://localhost:3333 and sign in with the account Deb invited.`)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(`Standalone Studio setup failed: ${error.message}`)
    process.exitCode = 1
  })
}
