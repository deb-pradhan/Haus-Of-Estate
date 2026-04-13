const POST_FIELDS = `
  _id,
  title,
  subtitle,
  "slug": slug.current,
  featuredImage,
  "author": author->{name, "slug": slug.current, avatar, role},
  "categories": categories[]->{title, "slug": slug.current, color},
  publishedAt,
  featured
`

export const POSTS_QUERY = `
  *[_type == "post" && status == "published"] | order(publishedAt desc) [$start...$end] {
    ${POST_FIELDS}
  }
`

export const POSTS_COUNT_QUERY = `
  count(*[_type == "post" && status == "published"])
`

export const FEATURED_POST_QUERY = `
  *[_type == "post" && status == "published" && featured == true][0] {
    ${POST_FIELDS}
  }
`

export const POST_BY_SLUG_QUERY = `
  *[_type == "post" && slug.current == $slug && status == "published"][0] {
    ${POST_FIELDS},
    body
  }
`

export const POSTS_BY_CATEGORY_QUERY = `
  *[_type == "post" && status == "published" && $slug in categories[]->slug.current] | order(publishedAt desc) [$start...$end] {
    ${POST_FIELDS}
  }
`

export const POSTS_BY_CATEGORY_COUNT_QUERY = `
  count(*[_type == "post" && status == "published" && $slug in categories[]->slug.current])
`

export const RELATED_POSTS_QUERY = `
  *[_type == "post" && status == "published" && _id != $postId && count(categories[@._ref in $categoryIds]) > 0] | order(publishedAt desc) [0...3] {
    ${POST_FIELDS}
  }
`

export const CATEGORIES_QUERY = `
  *[_type == "category"] | order(title asc) {
    _id, title, "slug": slug.current, description, color
  }
`

export const POST_SLUGS_QUERY = `
  *[_type == "post" && status == "published" && defined(slug.current)] {
    "slug": slug.current
  }
`

export const SEO_QUERY = `
  *[_type == "post" && slug.current == $slug][0] {
    title,
    subtitle,
    seo,
    publishedAt
  }
`