import { describe, expect, it } from 'vitest'

import {
  getEditorialApprovalIssues,
  isEditorialReadyForNativePublish,
} from './editorial-workflow'
import { POST_BY_SLUG_QUERY, PROPERTY_BY_SLUG_QUERY } from './queries'

const completeApproval = {
  contentApproved: true,
  seoApproved: true,
  approvedBy: 'Sonia and Tanu',
  approvedAt: '2026-09-01T12:00:00Z',
}

describe('editorial publication workflow', () => {
  it('does not require approval metadata while a document remains a draft', () => {
    expect(getEditorialApprovalIssues({ status: 'draft' })).toEqual([])
  })

  it('requires an auditable approval before approved or published states', () => {
    const issues = getEditorialApprovalIssues({ status: 'approved' })

    expect(issues).toContain('Content and factual approval is required.')
    expect(issues).toContain('SEO and tracking approval is required.')
    expect(issues).toContain('Record who approved the content.')
    expect(issues).toContain('Record when the content was approved.')
  })

  it('enables native publishing only at Published with complete approval', () => {
    expect(
      isEditorialReadyForNativePublish({
        status: 'approved',
        editorialApproval: completeApproval,
      }),
    ).toBe(false)

    expect(
      isEditorialReadyForNativePublish({
        status: 'published',
        editorialApproval: completeApproval,
      }),
    ).toBe(true)
  })

  it('keeps published public reads while allowing draft-perspective review', () => {
    for (const query of [POST_BY_SLUG_QUERY, PROPERTY_BY_SLUG_QUERY]) {
      expect(query).toContain('status == "published"')
      expect(query).toContain('_originalId in path("drafts.**")')
    }
  })
})
