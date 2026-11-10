import { BLOG_AUTHOR_NAME } from '@/lib/blog-author'

interface AuthorCardProps {
  variant?: 'compact' | 'full'
}

export function AuthorCard({ variant = 'compact' }: AuthorCardProps) {
  if (variant === 'full') {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-gold-500">Written by</p>
        <h3 className="mt-1 font-serif text-xl text-ink-900">{BLOG_AUTHOR_NAME}</h3>
      </div>
    )
  }

  return <p className="text-sm font-medium text-ink-900">By {BLOG_AUTHOR_NAME}</p>
}
