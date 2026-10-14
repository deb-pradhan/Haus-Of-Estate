import approvedRoles from '../../content/careers-roles.json'

// Approved reopening list, revised 25 September. Missing CMS records expose only supplied facts.
export const APPROVED_CAREER_ROLES = approvedRoles

// These reviewed renames retain the same vacancy identity and URL. No other
// historical title may borrow an approved slug to become a current opening.
const PREVIOUS_ROLE_TITLES: Readonly<Record<string, readonly string[]>> = {
  'lettings-specialist-uk-nationwide-self-employed': ['Lettings Specialist - UK Nationwide - Self Employed'],
  'real-estate-agent-uk-nationwide-self-employed': ['Real Estate Agent - UK Nationwide - Self Employed'],
}

export interface CareerRole {
  _id: string
  slug: string
  title: string
  status?: string
  department?: string
  location?: string
  employmentType?: string
  summary?: string
  description?: unknown
  responsibilities?: string[]
  requirements?: string[]
  niceToHave?: string[]
  applyEmail?: string
  featured?: boolean
  publishedAt?: string
}

export function resolveCareerRole(slug: string, record?: CareerRole | null): CareerRole | null {
  const approved = approvedRoles.find((role) => role.slug === slug)
  if (!approved) return null
  // An explicit CMS closure/draft must win over the title-only fallback.
  if (record && (
    record.slug !== slug || record.status !== 'open'
    || (record.title !== approved.title && !PREVIOUS_ROLE_TITLES[slug]?.includes(record.title))
  )) return null
  // The reviewed title/group/terms take precedence over older CMS categorisation.
  return record ? { ...record, ...approved } : { ...approved, _id: `approved-${slug}`, status: 'open' }
}

export function careerRoleLabel(role: Pick<CareerRole, 'title' | 'location'>): string {
  return role.location ? `${role.title} — ${role.location}` : role.title
}

export function isApprovedCareersPath(pathname: string): boolean {
  let path = pathname
  try { path = decodeURIComponent(path) } catch { return false }
  path = path.replace(/\/$/, '')
  return path === '/careers' || approvedRoles.some(({ slug }) => path === `/careers/${slug}`)
}

export function resolveCareerRoles(records: CareerRole[] | null): CareerRole[] {
  return approvedRoles.flatMap(({ slug }) => {
    const role = resolveCareerRole(slug, records?.find((record) => record.slug === slug))
    return role ? [role] : []
  })
}
