import { COMPANY_IDENTITY } from '@/lib/company-identity'

interface AuthorCardProps {
  variant?: 'compact' | 'full'
}

// Public articles use the company byline. Original author records remain in
// Sanity for editorial history and are not presented as the company profile.
export function AuthorCard({ variant = 'compact' }: AuthorCardProps) {
  if (variant === 'full') {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-gold-500">Written by</p>
        <h3 className="mt-1 font-serif text-xl text-ink-900">{COMPANY_IDENTITY.name}</h3>
      </div>
    )
  }

  return (
    <p className="text-sm font-medium text-ink-900">By {COMPANY_IDENTITY.name}</p>
  )
}
