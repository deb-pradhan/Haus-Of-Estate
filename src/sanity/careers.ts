import { client } from '@/sanity'
import { ROLE_BY_SLUG_QUERY, ROLES_QUERY } from '@/sanity/queries'
import { resolveCareerRole, resolveCareerRoles, type CareerRole } from '@/lib/career-roles'

export async function getCareerRoles() {
  // Let callers distinguish an outage from a successful query with no records.
  return resolveCareerRoles(await client.fetch<CareerRole[]>(ROLES_QUERY, {}, { perspective: 'published' }))
}

export async function getCareerRole(slug: string) {
  if (!resolveCareerRole(slug)) return null
  return resolveCareerRole(slug, await client.fetch<CareerRole | null>(ROLE_BY_SLUG_QUERY, { slug }, { perspective: 'published' }))
}
