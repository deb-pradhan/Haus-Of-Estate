export const EDITORIAL_STATUS_OPTIONS = [
  { title: 'Draft', value: 'draft' },
  { title: 'In review', value: 'in_review' },
  { title: 'Approved', value: 'approved' },
  { title: 'Published', value: 'published' },
  { title: 'Archived', value: 'archived' },
] as const

type EditorialDocument = {
  status?: unknown
  editorialApproval?: {
    contentApproved?: unknown
    seoApproved?: unknown
    approvedBy?: unknown
    approvedAt?: unknown
  }
}

const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export function getEditorialApprovalIssues(document: unknown): string[] {
  if (!document || typeof document !== 'object') {
    return ['The document is unavailable.']
  }

  const value = document as EditorialDocument
  if (value.status !== 'approved' && value.status !== 'published') return []

  const issues: string[] = []
  if (value.editorialApproval?.contentApproved !== true) {
    issues.push('Content and factual approval is required.')
  }
  if (value.editorialApproval?.seoApproved !== true) {
    issues.push('SEO and tracking approval is required.')
  }
  if (!hasText(value.editorialApproval?.approvedBy)) {
    issues.push('Record who approved the content.')
  }
  if (!hasText(value.editorialApproval?.approvedAt)) {
    issues.push('Record when the content was approved.')
  }
  return issues
}

export function isEditorialReadyForNativePublish(document: unknown): boolean {
  if (!document || typeof document !== 'object') return false
  const value = document as EditorialDocument
  return value.status === 'published' && getEditorialApprovalIssues(value).length === 0
}
