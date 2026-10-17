/** Image as projected by our GROQ queries (asset URL and/or reference). */
export interface SanityImageValue {
  url?: string
  alt?: string
  asset?: { url?: string; _ref?: string; _id?: string }
}

/** A Portable Text block or inline node, loosely typed for traversal. */
export interface PortableTextNode {
  _type: string
  _key?: string
  style?: string
  text?: string
  children?: PortableTextNode[]
  [key: string]: unknown
}

export interface Author {
  _id: string
  name: string
  slug?: string
  avatar?: SanityImageValue
  role?: string
  bio?: string
  social?: {
    linkedin?: string
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
  featuredImage?: SanityImageValue
  author?: Author
  categories?: Category[]
  publishedAt: string
  featured?: boolean
  readMins?: number
  body?: PortableTextNode[]
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
  featuredImage?: SanityImageValue
  author?: {
    name: string
    slug?: string
    avatar?: SanityImageValue
    role?: string
  }
  categories?: Array<{
    title: string
    slug: string
    color?: string
  }>
  publishedAt: string
  featured?: boolean
  readMins?: number
}