/**
 * Explicit opt-in for the fixture showcase.
 *
 * Unlike the local `/dev` routes, this gate is deliberately independent of
 * NODE_ENV so a normal production build can host a protected design preview.
 * It defaults to off: without the flag every showcase route is a 404.
 * A noindex response is not access control; hosted previews still need
 * deployment protection in front of them.
 */
export const SHOWCASE_FLAG = 'HAUS_FIXTURE_SHOWCASE_ENABLED'
export const SHOWCASE_BASE_PATH = '/showcase'

export function isFixtureShowcaseEnabled(
  environment: Record<string, string | undefined> = process.env,
): boolean {
  return environment[SHOWCASE_FLAG] === 'true'
}

export function showcasePath(path = ''): string {
  return `${SHOWCASE_BASE_PATH}${path}`
}

export function showcasePropertyPath(slug: string, suffix = ''): string {
  return showcasePath(`/properties/${encodeURIComponent(slug)}${suffix}`)
}
