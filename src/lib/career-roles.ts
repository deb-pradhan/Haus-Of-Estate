import approvedRoles from '../../content/careers-roles.json'

// Sonia's 12 September 2026 hiring list. Missing CMS records expose titles only.
export const APPROVED_CAREER_ROLES = approvedRoles

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
  if (record && (record.status !== 'open' || record.title !== approved.title)) return null
  return record ?? { ...approved, _id: `approved-${slug}`, status: 'open' }
}

export function resolveCareerRoles(records: CareerRole[] | null): CareerRole[] {
  return approvedRoles.flatMap(({ slug }) => {
    const role = resolveCareerRole(slug, records?.find((record) => record.slug === slug))
    return role ? [role] : []
  })
}
