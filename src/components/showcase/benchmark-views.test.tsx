import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { CollectionCard, CommunityIntro, ReadyHomeCard } from './cards'
import { CollectionView } from './collection-view'
import { CommunityView } from './community-view'
import { ErrorSummary } from './form-parts'
import { ReadyHomeView } from './ready-home-view'
import { ShowcaseSearchForm } from './showcase-search-form'
import {
  findShowcaseCommunity, findShowcaseProperty, getShowcaseCatalogue,
  showcaseBedroomOptions, showcaseLocationGroups, showcaseSearchIndex, showcaseTypeOptions,
} from '@/lib/showcase/fixture'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}))

const catalogue = getShowcaseCatalogue()
const florence = catalogue.communities[0]
const townhouses = findShowcaseProperty('azizi-florence-4-bedroom-townhouses')!
const london = findShowcaseProperty('north-london-three-bedroom-property')!
const count = (html: string, text: string) => html.split(text).length - 1

describe('community page', () => {
  const html = renderToStaticMarkup(<CommunityView community={florence} />)

  it('states where its facts come from and when they were sampled', () => {
    expect(html).toContain('data-provenance')
    expect(html).toContain('the developer’s brochures and project renders supplied to Haus of Estate'.replace('’', '&#x27;'))
    expect(html).toContain('<time dateTime="2026-11-05">5 November 2026</time>')
  })

  it('labels every render inside its frame and counts the gallery', () => {
    // The hero and each gallery render carry the label in the frame, not only in a caption.
    expect(count(html, '>Illustration<')).toBeGreaterThanOrEqual(1 + florence.overview.media.gallery.length)
    expect(html).toContain(`${florence.overview.media.gallery.length} illustrations`)
  })

  it('offers an email question that promises nothing', () => {
    expect(html).toContain('href="mailto:sales@hausofestate.com?subject=')
    expect(html).toContain('the showcase itself sends nothing')
  })
})

describe('collection page', () => {
  const html = renderToStaticMarkup(
    <CollectionView collection={townhouses} community={findShowcaseCommunity(townhouses)} initialDesignKey="spada-4-home-corner" />,
  )

  it('puts a counted gallery, the facts and their source ahead of the design list', () => {
    const gallery = html.indexOf('data-image-count')
    expect(gallery).toBeGreaterThan(-1)
    expect(gallery).toBeLessThan(html.indexOf('Choose a design'))
    expect(html).toMatch(/Image <\/span>1 of \d+</)
    expect(html.indexOf('data-provenance')).toBeLessThan(html.indexOf('Choose a design'))
    expect(html).toMatch(/sq ft \([\d,–]+ sq m\)/)
  })

  it('gives three plain next steps for the selected design, with no urgency device', () => {
    const steps = html.match(/role="group" aria-label="Next steps for [^"]+"[\s\S]*?<\/div>/)?.[0] ?? ''
    expect(steps).toContain('Request the brochure')
    expect(steps).toContain('Email a question')
    expect(steps).toContain('Email to arrange a call')
    expect(html).not.toMatch(/only \d+ left|selling fast|people (are )?viewing|hurry|limited time/i)
  })

  it('puts a measurement note under every floor plan', () => {
    const plans = count(html, 'Open full size')
    expect(plans).toBeGreaterThan(0)
    expect(count(html, 'data-plan-note')).toBe(plans)
    expect(html).toContain('Measurements are approximate and for guidance only.')
  })

  it('keeps a disputed plot figure withheld beside the new metric conversion', () => {
    const novoli = renderToStaticMarkup(
      <CollectionView collection={townhouses} community={findShowcaseCommunity(townhouses)} initialDesignKey="novoli-4-home-corner" />,
    )
    expect(novoli).toContain('Withheld')
  })
})

describe('existing home page and cards', () => {
  const html = renderToStaticMarkup(<ReadyHomeView home={london} />)

  it('labels the concept board for what it is and says how many images there are', () => {
    expect(html).toContain('>Existing view and AI concept<')
    expect(html).toContain(`view all ${1 + london.media.gallery.length} images`)
    expect(html).toContain('href="#home-gallery"')
    expect(html).toContain('<time dateTime="2026-11-06">6 November 2026</time>')
  })

  it('offers a viewing request and a question, and still no brochure it does not have', () => {
    expect(html).toContain('Email to arrange a viewing')
    expect(html).toContain('Email a question')
    expect(html).toContain('No brochure is supplied for this home')
    expect(html).toContain('£500,000')
  })

  it('no longer lays an “Existing home” badge over a concept image on the card', () => {
    const card = renderToStaticMarkup(<ReadyHomeCard home={london} wide />)
    expect(card).toContain('Existing home · North London')
    expect(card).toContain('>Existing view and AI concept<')
    expect(card).not.toContain('absolute left-4 top-4')
  })

  it('labels the masterplan and collection card images in the frame', () => {
    expect(renderToStaticMarkup(<CommunityIntro community={florence} />)).toContain('>Masterplan · illustration<')
    expect(renderToStaticMarkup(<CollectionCard collection={townhouses} />)).toContain('>Illustration<')
  })
})

describe('search form', () => {
  const form = (initial = {}) => renderToStaticMarkup(
    <ShowcaseSearchForm locations={showcaseLocationGroups()} types={showcaseTypeOptions()} bedrooms={showcaseBedroomOptions()}
      index={showcaseSearchIndex(catalogue)} initial={initial} variant="bar" />,
  )

  it('shows how many homes each choice would leave and how many the search will show', () => {
    const html = form()
    expect(html).toContain('United Arab Emirates (5)')
    expect(html).toContain('United Kingdom (1)')
    expect(html).toContain('Townhouse (2)')
    expect(html).toContain('Show 6 homes')
  })

  it('makes a choice that would leave nothing unavailable instead of a dead end', () => {
    const html = form({ country: 'United Kingdom' })
    expect(html).toMatch(/<option value="5" disabled="">5\+ \(0\)<\/option>/)
    expect(html).toContain('Show 1 home<')
  })
})

describe('form error summary', () => {
  it('can take focus, counts the problems and links each one to its field', () => {
    const html = renderToStaticMarkup(<ErrorSummary errors={[['email', 'Enter an email address.'], ['form', 'Choose a design first.']]}
      fieldIds={{ email: 'f-email' }} />)
    expect(html).toContain('role="alert"')
    expect(html).toContain('tabindex="-1"')
    expect(html).toContain('There are 2 problems to fix:')
    expect(html).toContain('<a href="#f-email"')
    expect(html).toContain('Choose a design first.')
    expect(renderToStaticMarkup(<ErrorSummary errors={[]} fieldIds={{}} />)).toBe('')
  })
})
