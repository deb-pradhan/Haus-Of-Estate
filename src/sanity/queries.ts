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

// ── Roles ─────────────────────────────────────────────────────────────

const ROLE_CARD_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  department,
  location,
  employmentType,
  summary,
  featured,
  publishedAt
`

export const ROLES_QUERY = `
  *[_type == "role" && status == "open"]
    | order(featured desc, publishedAt desc) {
      ${ROLE_CARD_FIELDS}
    }
`

export const ROLE_BY_SLUG_QUERY = `
  *[_type == "role" && slug.current == $slug && status == "open"][0] {
    ${ROLE_CARD_FIELDS},
    description,
    responsibilities,
    requirements,
    niceToHave,
    applyEmail
  }
`

export const ROLE_SLUGS_QUERY = `
  *[_type == "role" && status == "open" && defined(slug.current)] {
    "slug": slug.current
  }
`

// ── Properties ────────────────────────────────────────────────────────

const PROPERTY_CARD_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  community,
  masterDevelopment,
  city,
  country,
  developer,
  unitType,
  unitNumber,
  bedrooms,
  bathrooms,
  sizeDisplay,
  plotSizeDisplay,
  priceDisplay,
  paymentPlan,
  view,
  completionStatus,
  summary,
  featured,
  publishedAt,
  featuredImage
`

export const PROPERTIES_QUERY = `
  *[_type == "property" && status == "published"]
    | order(featured desc, publishedAt desc) {
      ${PROPERTY_CARD_FIELDS}
    }
`

export const FEATURED_PROPERTIES_QUERY = `
  *[_type == "property" && status == "published" && featured == true]
    | order(publishedAt desc) [0...3] {
      ${PROPERTY_CARD_FIELDS}
    }
`

export const PROPERTY_BY_SLUG_QUERY = `
  *[_type == "property" && slug.current == $slug && status == "published"][0] {
    ${PROPERTY_CARD_FIELDS},
    description,
    keyFeatures,
    amenities,
    locationBenefits,
    gallery,
    videoUrl,
    enquiryEmail
  }
`

export const PROPERTY_SLUGS_QUERY = `
  *[_type == "property" && status == "published" && defined(slug.current)] {
    "slug": slug.current
  }
`

// ── Team / Testimonials / FAQs / Culture ──────────────────────────────

export const TEAM_MEMBERS_QUERY = `
  *[_type == "teamMember" && status == "published"]
    | order(order asc, name asc) {
      _id,
      name,
      "slug": slug.current,
      role,
      department,
      photo,
      shortBio,
      email,
      phone,
      linkedinUrl,
      markets
    }
`

export const FEATURED_TESTIMONIALS_QUERY = `
  *[_type == "testimonial" && status == "published"]
    | order(featured desc, order asc, _createdAt desc) [0...6] {
      _id,
      authorName,
      authorLocation,
      authorPhoto,
      rating,
      quote,
      tag,
      source,
      datePublished
    }
`

export const TESTIMONIALS_QUERY = `
  *[_type == "testimonial" && status == "published"]
    | order(order asc, _createdAt desc) {
      _id,
      authorName,
      authorLocation,
      authorPhoto,
      rating,
      quote,
      tag,
      source,
      datePublished
    }
`

export const FAQS_QUERY = `
  *[_type == "faq" && status == "published"]
    | order(category asc, order asc) {
      _id,
      question,
      "slug": slug.current,
      category,
      answer,
      featured
    }
`

export const FEATURED_FAQS_QUERY = `
  *[_type == "faq" && status == "published" && featured == true]
    | order(order asc) [0...6] {
      _id,
      question,
      "slug": slug.current,
      category,
      answer
    }
`

export const CULTURE_MOMENTS_QUERY = `
  *[_type == "cultureMoment" && status == "published"]
    | order(order asc, _createdAt desc) {
      _id,
      caption,
      photo,
      category,
      takenOn
    }
`
