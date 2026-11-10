import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { evaluate, parse } from 'groq-js'
import { describe, expect, it, vi } from 'vitest'
import { AuthorCard } from './AuthorCard'
import { BlogCard } from './BlogCard'
import { FeaturedPost } from './FeaturedPost'
import { BLOG_AUTHOR_JSON_LD } from '@/lib/blog-author'
import { blogThumbnailPosition } from '@/lib/blog-thumbnail'
import { DUBAI_ARTICLE_SLUG, DUBAI_CANVA_COVER } from '@/lib/blog-cover'
import { POST_FIELDS } from '@/sanity/queries'

const images = vi.hoisted(() => ({ rendered: vi.fn() }))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => createElement('a', { href }, children),
}))
vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string; style?: Record<string, string>; quality?: number }) => {
    images.rendered(props)
    return createElement('img', { src: props.src, alt: props.alt, style: props.style })
  },
}))
vi.mock('@/components/saved-content', () => ({ SaveContentButton: () => null }))

const legacyAuthor = { name: 'Former individual author', bio: 'Personal biography', avatar: { url: 'https://example.com/private-avatar.jpg' } }
const post = {
  _id: 'test-post', _type: 'post', title: 'Property guide', slug: 'property-guide',
  publishedAt: '2026-09-23T00:00:00Z', author: legacyAuthor,
  featuredImage: { url: 'https://cdn.sanity.io/images/test1234/production/2b6588fc2082791b334c039e7bb914ba868a0cd7-821x957.png' },
}

describe('public article attribution and covers', () => {
  it('projects only the company byline despite a linked personal author', async () => {
    const dataset = [
      { ...post, author: { _ref: 'former-author' } },
      { _id: 'former-author', _type: 'author', ...legacyAuthor },
    ]
    const result = await (await evaluate(parse(`*[_type == "post"]{${POST_FIELDS}}`), { dataset })).get()
    expect(result[0].author).toEqual({ name: 'Haus of Estate' })
    expect(JSON.stringify(result)).not.toMatch(/Former individual author|Personal biography|private-avatar/)
    expect(BLOG_AUTHOR_JSON_LD).toEqual({ '@type': 'Organization', name: 'Haus of Estate', url: 'https://hausofestate.com' })
  })

  it('ignores legacy personal details on every card while framing the approved cover', () => {
    for (const html of [
      renderToStaticMarkup(<BlogCard post={post} />),
      renderToStaticMarkup(<FeaturedPost post={post} />),
    ]) {
      expect(html).toContain('Haus of Estate')
      expect(html).not.toMatch(/Former individual author|Personal biography|private-avatar/)
      expect(html).toContain('object-position:center top')
    }
    const card = renderToStaticMarkup(<AuthorCard variant="full" />)
    expect(card).toContain('Haus of Estate')
  })

  it('serves the supplied Dubai replacement cover crisply on cards', () => {
    const withdrawn = 'https://cdn.sanity.io/images/jdxbkry4/production/0452e218d2a9a0702d39bddfed605b040f82a7e5-1920x1080.jpg'
    const dubai = { ...post, slug: DUBAI_ARTICLE_SLUG, featuredImage: { url: withdrawn } }
    for (const element of [<BlogCard key="card" post={dubai} />, <FeaturedPost key="featured" post={dubai} />]) {
      images.rendered.mockClear()
      const html = renderToStaticMarkup(element)
      expect(html).toContain(DUBAI_CANVA_COVER)
      expect(html).not.toContain(withdrawn)
      expect(images.rendered).toHaveBeenCalledWith(expect.objectContaining({ src: DUBAI_CANVA_COVER, quality: 90 }))
    }
  })

  it('aligns only the exact legacy Sanity assets to the top', () => {
    expect(blogThumbnailPosition(`${post.featuredImage.url}?w=900`)).toBe('center top')
    expect(blogThumbnailPosition(post.featuredImage.url.replace('cdn.sanity.io', 'example.com'))).toBe('center')
    expect(blogThumbnailPosition('https://cdn.sanity.io/images/test1234/production/new-cover-1920x1080.jpg')).toBe('center')
    expect(blogThumbnailPosition('/fallback.jpg')).toBe('center')
  })
})
