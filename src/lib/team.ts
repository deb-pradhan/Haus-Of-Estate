import type { PortableTextBlock } from '@portabletext/types'
import { HAUS_SITE_ORIGIN } from './share'

export interface TeamMember {
  _id: string
  _originalId?: string
  status?: 'draft' | 'published'
  name: string
  slug?: string
  role: string
  department?: string
  photo?: { alt?: string } & Record<string, unknown>
  localPhoto?: string
  shortBio?: string
  fullBio?: PortableTextBlock[]
  email?: string
  phone?: string
  linkedinUrl?: string
  instagramUrl?: string
  markets?: string[]
}

// Sonia's 15/22 September emails and Surya's approved 22 September plan.
// Keep other profiles held until their contracts and publication are approved.
export const SONIA_PROFILE: TeamMember = {
  _id: 'approved-sonia-baig',
  slug: 'sonia-baig',
  name: 'Sonia Baig',
  role: 'Founder',
  department: 'Leadership',
  localPhoto: '/team/sonia-baig.jpg',
  shortBio: 'Founder of Haus of Estate, connecting clients with property specialists across the UK, UAE and beyond.',
  fullBio: [{
    _type: 'block', _key: 'introduction', style: 'normal', markDefs: [],
    children: [{
      _type: 'span', _key: 'text', marks: [],
      text: 'Sonia founded Haus of Estate to connect clients with property specialists across the UK, UAE and beyond. Her work focuses on helping people navigate buying, investing, relocating and selling across markets.',
    }],
  }],
  linkedinUrl: 'https://www.linkedin.com/in/soniabaig/',
  instagramUrl: 'https://www.instagram.com/soniabaig/',
}

export function approvedTeamMembers(records: TeamMember[] | null = null): TeamMember[] {
  const sonia = records?.find((member) => (
    member.slug === SONIA_PROFILE.slug
    && member.status === 'published'
    && !/^(drafts|versions)\./.test(member._id)
    && !/^(drafts|versions)\./.test(member._originalId || '')
  ))
  if (!sonia) return [SONIA_PROFILE]
  const supplied = Object.fromEntries(Object.entries(sonia).filter(([, value]) => (
    value != null
    && (typeof value !== 'string' || value.trim().length > 0)
    && (!Array.isArray(value) || value.length > 0)
  )))
  return [{ ...SONIA_PROFILE, ...supplied } as TeamMember]
}

export function teamPersonSchema(member: TeamMember, image: string) {
  return {
    '@context': 'https://schema.org', '@type': 'Person',
    '@id': `${HAUS_SITE_ORIGIN}/team#${member.slug}`,
    name: member.name, jobTitle: member.role, description: member.shortBio,
    image: new URL(image, HAUS_SITE_ORIGIN).href,
    url: `${HAUS_SITE_ORIGIN}/team#${member.slug}`,
    worksFor: { '@type': 'Organization', name: 'Haus of Estate', url: HAUS_SITE_ORIGIN },
    sameAs: [member.linkedinUrl, member.instagramUrl].filter(Boolean),
  }
}
