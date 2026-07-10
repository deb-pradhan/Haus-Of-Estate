import { BlogCard } from './BlogCard'

interface Post {
  _id: string
  title: string
  subtitle?: string
  slug: string
  featuredImage?: any
  author?: {
    name: string
    avatar?: any
    role?: string
  }
  categories?: Array<{
    title: string
    slug: string
    color?: string
  }>
  publishedAt: string
  readMins?: number
}

interface BlogGridProps {
  posts: Post[]
  emptyMessage?: string
}

export function BlogGrid({ posts, emptyMessage }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
        <div className="rounded-full bg-stone-100 p-4">
          <svg className="h-8 w-8 text-mist-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="mt-4 font-serif text-xl text-ink-900">No articles found</h3>
        <p className="mt-1 text-sm text-slate-700">
          {emptyMessage || 'Try a different category or search term.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post._id} post={post} />
      ))}
    </div>
  )
}
