export interface Author {
  _id: string
  name: string
  slug?: string
  avatar?: any
  role?: string
  bio?: string
  social?: {
    linkedin?: string
    twitter?: string
    email?: string
  }
}

export interface Category {
  _id: string
  _ref?: string
  title: string
  slug: string
  description?: string
  color?: string
}

export interface Post {
  _id: string
  title: string
  subtitle?: string
  slug: string
  featuredImage?: any
  author?: Author
  categories?: Category[]
  publishedAt: string
  featured?: boolean
  body?: any[]
  seo?: {
    seoTitle?: string
    seoDesc?: string
  }
}

export interface PostSummary {
  _id: string
  title: string
  subtitle?: string
  slug: string
  featuredImage?: any
  author?: {
    name: string
    slug?: string
    avatar?: any
    role?: string
  }
  categories?: Array<{
    title: string
    slug: string
    color?: string
  }>
  publishedAt: string
  featured?: boolean
}