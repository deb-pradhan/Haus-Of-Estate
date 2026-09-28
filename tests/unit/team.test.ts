import { describe, expect, it } from 'vitest'
import { approvedTeamMembers, SONIA_PROFILE, teamPersonSchema, type TeamMember } from '../../src/lib/team'

const publishedSonia: TeamMember = {
  _id: 'sonia', slug: 'sonia-baig', status: 'published',
  name: 'Sonia Baig', role: 'Founder', shortBio: 'Updated introduction',
}

describe('approved team visibility', () => {
  it('shows the supplied founder profile when CMS content is unavailable', () => {
    expect(approvedTeamMembers(null)).toEqual([SONIA_PROFILE])
    expect(approvedTeamMembers([])).toEqual([SONIA_PROFILE])
  })
  it('keeps other staff and unpublished founder records held', () => {
    const held: TeamMember[] = [
      { ...publishedSonia, _id: 'other', slug: 'held-colleague', name: 'Held colleague' },
      { ...publishedSonia, status: 'draft' },
      { ...publishedSonia, status: undefined },
      { ...publishedSonia, _id: 'drafts.sonia' },
      { ...publishedSonia, _id: 'versions.release.sonia' },
      { ...publishedSonia, _originalId: 'drafts.sonia' },
      { ...publishedSonia, _originalId: 'versions.release.sonia' },
    ]
    for (const record of held) {
      expect(approvedTeamMembers([record])).toEqual([SONIA_PROFILE])
    }
  })
  it('uses published founder copy while retaining supplied optional links', () => {
    const [member] = approvedTeamMembers([publishedSonia])
    expect(member.shortBio).toBe('Updated introduction')
    expect(teamPersonSchema(member, member.localPhoto!).sameAs).toEqual([
      'https://www.linkedin.com/in/soniabaig/', 'https://www.instagram.com/soniabaig/',
    ])
  })
  it('retains approved defaults for empty profile fields', () => {
    const [member] = approvedTeamMembers([{
      ...publishedSonia, role: ' ', name: '', linkedinUrl: '',
      instagramUrl: undefined, fullBio: [],
    }])
    expect(member._id).toBe(publishedSonia._id)
    expect(member.shortBio).toBe(publishedSonia.shortBio)
    expect(member.name).toBe('Sonia Baig')
    expect(member.role).toBe('Founder')
    expect(member.linkedinUrl).toBe(SONIA_PROFILE.linkedinUrl)
    expect(member.instagramUrl).toBe(SONIA_PROFILE.instagramUrl)
    expect(member.fullBio).toEqual(SONIA_PROFILE.fullBio)
  })
})
