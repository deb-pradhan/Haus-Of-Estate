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
}

interface BlogGridProps {
  posts: Post[]
  columns?: 2 | 3
}

export function BlogGrid({ posts, columns = 3 }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-stone-100 p-4">
          <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="mt-4 font-serif text-lg text-ink-900">No posts yet</h3>
        <p className="mt-1 text-sm text-slate-700">Check back soon for new content.</p>
      </div>
    )
  }

  return (
    <div
      className={`grid gap-6 ${
        columns === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {posts.map((post) => (
        <BlogCard key={post._id} post={post} />
      ))}
    </div>
  )
}