import { describe, expect, it } from 'vitest'
import { findShowcaseArticle, getShowcaseArticles } from './articles'

describe('showcase draft articles', () => {
  const article = findShowcaseArticle('palm-springs-by-nakheel-dubai')!

  it('loads the Palm Springs draft with the supplied SEO settings and no image', () => {
    expect(getShowcaseArticles().map((item) => item.slug)).toEqual(['palm-springs-by-nakheel-dubai'])
    expect(article.status).toBe('draft')
    expect(article.title.length).toBeLessThanOrEqual(120)
    expect(article.subtitle!.length).toBeLessThanOrEqual(200)
    expect(article.seo).toEqual({
      seoTitle: 'Palm Springs by Nakheel Dubai – Launch Date, Prices & EOI',
      seoDesc: 'Discover Palm Springs by Nakheel in Dubai. Explore expected villa prices, townhouses, launch dates and EOI registration. Contact Haus of Estate.',
    })
    expect(article.launch?.key).toBe('palm-springs-by-nakheel')
    expect(article.categorySlugs).toEqual(['dubai', 'market-insights'])
  })

  it('keeps every particular qualified and routes follow-up to the sales inbox', () => {
    const text = article.body.flatMap((block) => (block.children as Array<{ text: string }>).map((span) => span.text)).join('\n')
    expect(text).toMatch(/indicative and should not be treated as official developer prices/)
    expect(text).toMatch(/subject to confirmation by Nakheel/)
    expect(text).toMatch(/must be confirmed with the developer before any payment is made/)
    expect(text).toMatch(/not a developer EOI: it involves no payment, does not reserve a unit and does not guarantee priority/)
    expect(text).toContain('sales@hausofestate.com')
    expect(text).not.toContain('info@hausofestate.com')
    expect(text).not.toMatch(/guaranteed|sold out|secure your unit/i)
  })

  it('points in-article register links at the preview section and keeps other links intact', () => {
    const links = article.body.flatMap((block) => (block.markDefs as Array<{ _type: string; href: string }>).filter((mark) => mark._type === 'link').map((mark) => mark.href))
    expect(links).toContain('#register-interest')
    expect(links).not.toContainEqual(expect.stringMatching(/hausofestate\.com\/register-interest/))
    expect(links).toContain('https://hausofestate.com/properties')
    expect(links).toContain('https://hausofestate.com/blog?category=investment-guides')
    expect(links).toContain('mailto:sales@hausofestate.com')
  })

  it('surfaces the review flags Sonia must settle before publishing', () => {
    expect(article.reviewFlags.join('\n')).toMatch(/info@hausofestate\.com to sales@hausofestate\.com/)
    expect(article.reviewFlags.join('\n')).toMatch(/No approved Palm Springs image/)
    expect(findShowcaseArticle('missing')).toBeUndefined()
  })
})
