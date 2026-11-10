import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LeadOpenOptions, LeadProjectContext } from '@/components/lead-eoi/types'
import { PropertyDetailView, type PropertyDetail, type PropertyMedia } from './PropertyDetailView'
import PropertyDetailPage, { generateMetadata } from '@/app/(main)/properties/[slug]/page'
import PropertyPreviewPage from '@/app/dev/property-previews/[slug]/page'
import type { PropertyPreview } from '@/lib/property-previews'
import { PROPERTY_DEVELOPMENTS_QUERY } from '@/sanity/queries'
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGES } from '@/lib/seo'

const controls = vi.hoisted(() => ({
  save: vi.fn(),
  share: vi.fn(),
  project: vi.fn(),
  lead: vi.fn(),
  openLead: vi.fn(),
  draftMode: vi.fn(),
  fetch: vi.fn(),
  urlFor: vi.fn(),
  previews: vi.fn(),
}))

vi.mock('next/headers', () => ({ draftMode: controls.draftMode }))
vi.mock('@/sanity/live', () => ({ sanityFetch: controls.fetch }))
vi.mock('@/sanity', () => ({ urlFor: controls.urlFor }))
vi.mock('@/lib/property-previews', () => ({ loadPropertyPreviews: controls.previews, loadPropertyPreview: vi.fn() }))
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => createElement('img', { src, alt, className }),
}))
vi.mock('@/components/blog', () => ({ PortableTextRenderer: () => null }))
vi.mock('@/components/saved-content', () => ({
  SaveContentButton: (props: unknown) => { controls.save(props); return null },
}))
vi.mock('@/components/share/content-share', () => ({
  ContentShare: (props: unknown) => { controls.share(props); return null },
}))
vi.mock('@/components/lead-eoi/lead-project-context', () => ({
  LeadProjectContextRegistration: ({ project }: { project: LeadProjectContext }) => {
    controls.project(project)
    return null
  },
}))
vi.mock('@/components/lead-eoi/lead-eoi-trigger', () => ({
  LeadEoiTrigger: ({ options, children }: { options: LeadOpenOptions; children: ReactNode }) => {
    controls.lead(options)
    return createElement('button', null, children)
  },
}))
vi.mock('@/components/lead-eoi/lead-eoi-controller', () => ({
  useLeadEoi: () => ({ enabled: true, openLead: controls.openLead }),
}))

const property: PropertyDetail = {
  _id: 'property-florence',
  title: 'Azizi Florence',
  slug: 'azizi-florence',
  community: 'Azizi Venice',
  city: 'Dubai',
  country: 'United Arab Emirates',
  summary: 'Florence community overview.',
  listingType: ['sale'],
  availability: ['off-plan'],
  amenities: ['Community pool'],
}

const media = {
  hero: { src: '/dev/property-previews/media/florence.jpg', alt: 'Florence rendering' },
  gallery: [{ src: '/dev/property-previews/media/interior.jpg', alt: 'Florence interior' }],
}

beforeEach(() => {
  vi.stubEnv('PURCHASE_READINESS_ENABLED', 'true')
  controls.draftMode.mockResolvedValue({ isEnabled: false })
  controls.fetch.mockResolvedValue({ data: property })
})
afterEach(() => vi.unstubAllEnvs())

describe('shared property details', () => {
  it('connects the development overview and selected design buttons to the isolated demo', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const overview = renderToStaticMarkup(<PropertyDetailView property={property} media={media}
      preview={{ kind: 'development', brochureDemo: true }} />)
    expect(overview).toContain('href="/dev/property-previews#villas"')
    expect(overview).toContain('Choose a home &amp; request brochure')
    expect(overview).not.toContain('Enquiries disabled in preview')

    const home = { ...property, slug: 'azizi-florence-4-bedroom-villas', designVariants: [{
      _key: 'type-b', label: 'Type B', sellableAreaSqFt: 3831, images: [], floorPlans: [],
    }] }
    const details = renderToStaticMarkup(<PropertyDetailView property={home} media={media}
      preview={{ kind: 'home-type', brochureDemo: true }} />)
    expect(details).toContain('href="/dev/property-previews/azizi-florence-4-bedroom-villas/brochure-demo?design=type-b"')
    expect(details).not.toContain('Enquiries disabled in preview')
    expect(details).not.toContain('Brochure requests are disabled in preview.')
  })

  it('does not expose demo actions in production even with a preview demo prop', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const html = renderToStaticMarkup(<PropertyDetailView property={property} media={media}
      preview={{ kind: 'development', brochureDemo: true }} />)
    expect(html).toContain('Enquiries disabled in preview')
    expect(html).not.toContain('Choose a home &amp; request brochure')
    expect(html).not.toContain('/brochure-demo')
  })

  it('keeps the local community journey within its five matching preview collections', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_BROCHURE_DEMO_ENABLED', 'true')
    controls.urlFor.mockImplementation(() => { throw new Error('Local media must not use the Sanity image builder') })
    const overview: PropertyPreview = {
      kind: 'development', media,
      document: { _id: property._id, _type: 'property', title: property.title,
        community: property.community, city: property.city, country: 'United Arab Emirates',
        summary: property.summary, amenities: property.amenities,
        listingType: ['sale'], availability: ['off-plan'],
        slug: { _type: 'slug', current: property.slug } },
    }
    const collection = (unitType: string, bedrooms: number): PropertyPreview => {
      const slug = `azizi-florence-${bedrooms}-bedroom-${unitType.toLowerCase()}s`
      return { kind: 'home-type', media, document: {
        ...overview.document, _id: slug, slug: { _type: 'slug', current: slug },
        title: `${bedrooms}-bedroom ${unitType.toLowerCase()}s`, unitType, bedrooms,
        masterDevelopment: property.title, priceAmount: bedrooms * 1_000_000,
        priceCurrency: 'AED', priceDisplay: 'Clusters 1 & 2',
        designVariants: [{ _key: 'type-a', label: `${bedrooms}-bedroom Type A`, sellableAreaSqFt: 3000, images: [{
          src: `/dev/property-previews/media/${slug}.jpg`, alt: `${bedrooms}-bedroom ${unitType} rendering`,
        }], floorPlans: [] }],
      } }
    }
    const homes = [collection('Townhouse', 4), collection('Villa', 6), collection('Villa', 4),
      collection('Townhouse', 3), collection('Villa', 5)]
    const unrelated = (id: string, changes: Partial<PropertyPreview['document']>): PropertyPreview => ({
      ...homes[0], document: { ...homes[0].document, _id: id,
        slug: { _type: 'slug', current: id }, ...changes },
    })
    controls.previews.mockResolvedValue([overview, ...homes,
      unrelated('other-master', { masterDevelopment: 'Another development' }),
      unrelated('other-community', { community: 'Another community' }),
      unrelated('other-city', { city: 'Another city' }),
      unrelated('other-country', { country: 'Another country' }),
      { ...unrelated('individual-home', {}), kind: 'property' },
    ])

    const html = renderToStaticMarkup(await PropertyPreviewPage({ params: Promise.resolve({ slug: property.slug }) }))
    const collectionLinks = [...html.matchAll(/href="(\/dev\/property-previews\/azizi-florence-\d-bedroom-[^"]+)"/g)]
      .map((match) => match[1])
    expect(collectionLinks).toEqual([
      '/dev/property-previews/azizi-florence-4-bedroom-villas',
      '/dev/property-previews/azizi-florence-5-bedroom-villas',
      '/dev/property-previews/azizi-florence-6-bedroom-villas',
      '/dev/property-previews/azizi-florence-3-bedroom-townhouses',
      '/dev/property-previews/azizi-florence-4-bedroom-townhouses',
    ])
    expect(html).toContain('href="#home-collections"')
    expect(html).toContain('Choose a home &amp; request brochure')
    expect(html).toContain('id="villas"')
    expect(html).toContain('id="townhouses"')
    expect(html).toContain('Planned community amenities')
    expect(html).toContain('Clusters 1 &amp; 2')
    expect(html).toContain('src="/dev/property-previews/media/azizi-florence-4-bedroom-villas.jpg"')
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    expect(html).not.toMatch(/other-master|other-community|other-city|other-country|individual-home/)
    expect(html).not.toContain('href="/properties/azizi-florence-')
    expect(html).not.toContain('href="/dev/property-previews#villas"')
    expect(controls.lead).not.toHaveBeenCalled()
    expect(controls.project).not.toHaveBeenCalled()
  })

  it('keeps collection pricing separate from the selected design and continues to its brochure action', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const html = renderToStaticMarkup(<PropertyDetailView property={{ ...property,
      priceAmount: 2260000, priceCurrency: 'AED', priceDisplay: 'AED 2,260,000–3,418,000 · Clusters 1 & 2',
      designVariants: [{ _key: 'novoli-corner', label: 'Novoli corner', family: 'Novoli', rowHomes: 4,
        plotAreaStatus: 'conflict', plotAreaSqFt: 9999, sellableAreaSqFt: 2711, images: [], floorPlans: [],
      }, { _key: 'spada-middle', label: 'Spada middle', family: 'Spada', rowHomes: 6,
        plotAreaSqFt: 1938, sellableAreaSqFt: 2663, images: [], floorPlans: [],
      }],
    }} media={media} preview={{ kind: 'home-type', brochureDemo: true }} />)
    expect(html).toContain('Supplied collection range')
    expect(html).toContain('Prices apply to the bedroom collection.')
    expect(html).toContain('href="#selected-design"')
    expect(html).toContain('/brochure-demo?design=novoli-corner')
    expect(html).toContain('2,663')
    expect(html).toContain('1,938 sq ft')
    expect(html).not.toContain('9,999')
    expect(html).not.toContain('9999')
    expect(html).toContain('>Novoli</h3>')
    expect(html).toContain('>Spada</h3>')
  })

  it('renders the published community overview, grouped home links and public parent navigation', async () => {
    controls.urlFor.mockReturnValue({ width: vi.fn().mockReturnThis(), height: vi.fn().mockReturnThis(), fit: vi.fn().mockReturnThis(), url: () => '/sized-villa-design.jpg' })
    const overview = { ...property, unitType: 'Development' }
    const villa = { ...property, _id: 'villa-four', title: 'Four-bedroom villas', slug: 'florence-four-villas',
      masterDevelopment: property.title, unitType: 'Villa', bedrooms: 4, priceAmount: 3_350_000, priceCurrency: 'AED',
      priceDisplay: 'AED 3,350,000 · Clusters 1 & 2', designCount: 2,
      designImage: { src: '/villa-design.jpg', alt: 'Matched villa design' },
    }
    const townhouse = { ...villa, _id: 'townhouse-three', title: 'Three-bedroom townhouses', slug: 'florence-three-townhouses', unitType: 'Townhouse', bedrooms: 3 }
    const development = { ...overview, collections: [villa, townhouse] }
    controls.fetch.mockImplementation(async ({ query }) => ({ data: query === PROPERTY_DEVELOPMENTS_QUERY ? [development] : overview }))
    const html = renderToStaticMarkup(await PropertyDetailPage({ params: Promise.resolve({ slug: overview.slug }) }))
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    expect(html).toContain('Community overview · Dubai')
    expect(html).toContain('id="villas"')
    expect(html).toContain('id="townhouses"')
    expect(html).toContain('href="/properties/florence-four-villas"')
    expect(html).toContain('href="/properties/florence-three-townhouses"')
    expect(html).toContain('Matched villa design')
    expect(html).toContain('2 brochure designs')
    expect(html).toContain('Clusters 1 &amp; 2')
    expect(html).toContain('current availability are confirmed on enquiry')
    expect(html).not.toContain('/dev/property-previews')

    controls.fetch.mockImplementation(async ({ query }) => ({ data: query === PROPERTY_DEVELOPMENTS_QUERY ? [development] : villa }))
    const child = renderToStaticMarkup(await PropertyDetailPage({ params: Promise.resolve({ slug: villa.slug }) }))
    const breadcrumb = child.match(/<nav aria-label="Breadcrumb">[\s\S]*?<\/nav>/)?.[0] ?? ''
    expect(breadcrumb).toContain('href="/properties/azizi-florence"')
    expect(child).toContain('View the Azizi Florence community overview')

    controls.fetch.mockImplementation(async ({ query }) => ({ data: query === PROPERTY_DEVELOPMENTS_QUERY ? [] : villa }))
    const withoutParent = renderToStaticMarkup(await PropertyDetailPage({ params: Promise.resolve({ slug: villa.slug }) }))
    expect(withoutParent).not.toContain('href="/properties/azizi-florence"')
  })

  it.each(['concept', 'concept-comparison'] as const)('uses branded social metadata for %s without cropping its labels', async (mediaKind) => {
    controls.fetch.mockResolvedValue({ data: { ...property, featuredImage: { mediaKind, alt: 'Before and proposed after' } } })
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: property.slug }) })
    expect(metadata.openGraph?.images).toEqual(DEFAULT_OG_IMAGES)
    expect(metadata.twitter && 'images' in metadata.twitter ? metadata.twitter.images : undefined).toEqual([DEFAULT_OG_IMAGE])
    expect(controls.urlFor).not.toHaveBeenCalled()
  })

  it('shows supplied property plans uncropped and separately from proposed interiors, with the source area wording', () => {
    const html = renderToStaticMarkup(<PropertyDetailView
      property={{ ...property, _id: 'drafts.london',
        sizeDisplay: 'Approx. Gross Internal Floor Area: 889.9 sq ft / 82.67 m²',
        floorPlans: [{ src: '/london-plan.jpg', alt: 'Ground and first floors', mediaKind: 'floor-plan', caption: 'Measurements are approximate and for guidance only.' }],
      }}
      media={{ gallery: [{ src: '/concept.jpg', alt: 'Proposed interior', mediaKind: 'concept' }] }}
      preview={{ kind: 'property' }}
    />)
    expect(html).toContain('id="floor-plans"')
    expect(html).toContain('href="/london-plan.jpg" target="_blank" rel="noopener noreferrer"')
    expect(html).toContain('alt="Ground and first floors" class="object-contain"')
    expect(html).toContain('Measurements are approximate and for guidance only.')
    expect(html).toContain('Approx. Gross Internal Floor Area: 889.9 sq ft / 82.67 m²')
    expect(html.indexOf('id="floor-plans"')).toBeLessThan(html.indexOf('Proposed interiors</h2>'))
  })

  it('preserves a Monaco-style property without designs, including its original media, sizes and public actions', () => {
    const monaco: PropertyDetail = {
      ...property,
      _id: 'property-monaco',
      title: 'Azizi Monaco Mansions',
      slug: 'azizi-monaco-mansions',
      unitType: 'Villa',
      sizeDisplay: 'Size supplied by listing',
      plotSizeDisplay: 'Plot supplied by listing',
    }
    const monacoMedia = {
      hero: { src: '/monaco-exterior.jpg', alt: 'Monaco exterior' },
      gallery: [{ src: '/monaco-interior.jpg', alt: 'Monaco interior' }],
    }
    const html = renderToStaticMarkup(<PropertyDetailView property={monaco} media={monacoMedia} />)

    const breadcrumb = html.match(/<nav aria-label="Breadcrumb">[\s\S]*?<\/nav>/)?.[0] ?? ''
    expect(breadcrumb).toContain('href="/"')
    expect(breadcrumb).toContain('href="/properties"')
    expect(breadcrumb).toMatch(/aria-current="page"[^>]*>Azizi Monaco Mansions<\/span>/)
    expect(breadcrumb).not.toContain('/dev/')
    expect(html).toContain('src="/monaco-exterior.jpg"')
    expect(html).toContain('src="/monaco-interior.jpg"')
    expect(html).toContain('Size supplied by listing')
    expect(html).toContain('Plot supplied by listing')
    expect(html).not.toContain('Home designs')
    expect(html).not.toContain('id="floor-plans"')
    expect(html).not.toContain('Varies by design')
    expect(html).not.toContain('Request full brochure')
    expect(controls.save).toHaveBeenCalledWith(expect.objectContaining({ sanityDocumentId: monaco._id }))
    expect(controls.share).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://hausofestate.com/properties/azizi-monaco-mansions' }))
    expect(controls.lead).toHaveBeenCalledWith(expect.objectContaining({ project: expect.objectContaining({ slug: monaco.slug }) }))
  })

  it.each(['local', 'sanity'] as const)('shows matched collection designs and hides disputed plot figures while disabling brochure requests in %s preview', (previewKind) => {
    const collection: PropertyDetail = {
      ...property,
      sizeDisplay: 'Old collection size',
      plotSizeDisplay: 'Old collection plot',
      designVariants: [{
        _key: 'type-a',
        label: 'Brochure Type A',
        plotAreaStatus: 'conflict',
        plotAreaSqFt: 2260,
        sellableAreaSqFt: 2660,
        images: [{ src: '/type-a-exterior.jpg', alt: 'Type A exterior' }],
        floorPlans: [{ src: '/type-a-plan.jpg', alt: 'Type A floor plan', label: 'Ground and first floor' }],
      }, {
        _key: 'type-b',
        label: 'Brochure Type B',
        plotAreaSqFt: 3363,
        sellableAreaSqFt: 3714,
        images: [{ src: '/type-b-exterior.jpg', alt: 'Type B exterior' }],
        floorPlans: [],
      }],
    }
    const html = renderToStaticMarkup(
      <PropertyDetailView
        property={collection}
        media={media}
        preview={previewKind === 'local' ? { kind: 'home-type' } : undefined}
        draftPreview={previewKind === 'sanity'}
      />,
    )

    expect(html.match(/<img[^>]+src="([^"]+)"/)?.[1]).toBe('/type-a-exterior.jpg')
    expect(html).not.toContain(media.hero.src)
    expect(html).not.toContain(media.gallery[0].src)
    expect(html).toContain('Home designs')
    expect(html).toContain('Varies by design')
    expect(html).not.toContain('Old collection size')
    expect(html).not.toContain('Old collection plot')
    expect(html).toContain('Brochure Type A')
    expect(html).toContain('Brochure Type B')
    expect(html).toContain('Plot area')
    expect(html).toContain('Built-up area')
    expect(html).toContain('2,660 sq ft')
    expect(html).toContain('Awaiting confirmation')
    expect(html).not.toContain('2,260')
    expect(html).not.toContain('2260')
    expect(html).toContain('href="/type-a-plan.jpg" target="_blank"')
    expect(html).toMatch(/<button\b[^>]*disabled=""[^>]*>Request full brochure<\/button>/)
    expect(controls.openLead).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
  })

  it('keeps existing photos unbranded and preserves their sources when a listing opts into the logo', () => {
    const original = renderToStaticMarkup(<PropertyDetailView property={property} media={media} />)
    const branded = renderToStaticMarkup(
      <PropertyDetailView property={{ ...property, showHausLogo: true }} media={media} />,
    )
    const disabled = renderToStaticMarkup(
      <PropertyDetailView property={{ ...property, showHausLogo: false }} media={media} />,
    )

    expect(original).not.toContain('src="/logo.svg"')
    expect(disabled).not.toContain('src="/logo.svg"')
    expect(branded.match(/src="\/logo.svg"/g)).toHaveLength(2)
    for (const image of [media.hero, ...media.gallery]) {
      expect(branded).toContain(`src="${image.src}"`)
      expect(branded).toContain(`alt="${image.alt}"`)
    }
    expect(branded).toContain('Enquire about this property')
  })

  it('preserves published saves, canonical sharing, property enquiries and purchase guidance', () => {
    const html = renderToStaticMarkup(<PropertyDetailView property={property} media={media} />)

    expect(controls.save).toHaveBeenCalledWith(expect.objectContaining({
      sanityDocumentId: property._id,
      contentType: 'PROPERTY',
    }))
    expect(controls.share).toHaveBeenCalledTimes(2)
    expect(controls.share).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://hausofestate.com/properties/azizi-florence',
    }))
    expect(controls.project).toHaveBeenCalledWith(expect.objectContaining({ slug: property.slug }))
    expect(controls.lead).toHaveBeenCalledWith(expect.objectContaining({
      interest: 'buy',
      project: expect.objectContaining({ slug: property.slug, title: property.title }),
    }))
    expect(html).toContain('How protected payment works')
    expect(html).toContain('Dubai off-plan purchase')
    expect(html).toContain('href="/mortgage-calculator"')
  })

  it('keeps Florence local previews editorial, including image media and unconfirmed details', () => {
    const html = renderToStaticMarkup(
      <PropertyDetailView property={property} media={media} preview={{ kind: 'home-type' }} />,
    )

    const breadcrumb = html.match(/<nav aria-label="Breadcrumb">[\s\S]*?<\/nav>/)?.[0] ?? ''
    expect(breadcrumb).toContain('href="/properties"')
    expect(breadcrumb).toContain('href="/dev/property-previews"')
    expect(breadcrumb).toContain('href="/dev/property-previews/azizi-florence"')
    expect(html).toContain('Local draft preview')
    expect(html).toContain('Awaiting confirmation')
    expect(html).toContain('View the Florence community overview')
    // Off-plan facilities are headed as planned, matching the live site.
    expect(html).toContain('Planned community amenities')
    expect(html).toContain(media.hero.src)
    expect(html).toContain(media.gallery[0].src)
    expect(html).toContain('Enquiries disabled in preview')
    expect(html).not.toContain('How protected payment works')
    expect(html).not.toContain('href="/mortgage-calculator"')
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
    expect(controls.project).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
  })

  it('labels a London property draft honestly and keeps complete concept comparisons visible', () => {
    const london: PropertyDetail = {
      _id: 'drafts.north-london-three-bedroom',
      title: '3-bedroom property for sale in North London',
      slug: 'north-london-three-bedroom',
      community: 'North London',
      city: 'London',
      country: 'United Kingdom',
      summary: 'A three-bedroom property offered for sale in North London.',
      listingType: ['sale'],
      bedrooms: 3,
    }
    const conceptMedia: PropertyMedia = {
      hero: { src: '/london-concept.jpg', alt: 'Living room proposal', mediaKind: 'concept', caption: 'Living room — AI-assisted proposed interiors; not completed works' },
      gallery: [{ src: '/london-comparison.jpg', alt: 'Existing living room beside a proposed interior', mediaKind: 'concept-comparison' }],
    }
    const html = renderToStaticMarkup(<PropertyDetailView property={london} media={conceptMedia} preview={{ kind: 'property' }} />)

    const breadcrumb = html.match(/<nav aria-label="Breadcrumb">[\s\S]*?<\/nav>/)?.[0] ?? ''
    expect(breadcrumb).toContain('href="/"')
    expect(breadcrumb).toContain('href="/properties"')
    expect(breadcrumb).toContain('href="/dev/property-previews"')
    expect(breadcrumb).toMatch(/aria-current="page"[^>]*>3-bedroom property for sale in North London<\/span>/)
    expect(html).not.toContain('Tenure')
    expect(html).not.toContain('EPC')
    expect(html).toContain('For sale')
    expect(html).toContain('Remaining particulars need Haus confirmation before publication.')
    expect(html).toContain('The public location shows the area and city only.')
    expect(html).not.toContain('Exact address')
    expect(html).toContain('Living room — AI-assisted proposed interiors; not completed works</p>')
    expect(html).toContain('Existing view and proposed interiors — AI-assisted concept; not completed works</figcaption>')
    expect(html.match(/class="object-contain"/g)).toHaveLength(2)
    expect(html).not.toContain('Florence')
    expect(html).not.toContain('Master community')
    expect(html).not.toContain('Handover')
    expect(html).not.toContain('Payment plan')
    expect(html).toContain('Enquiries disabled in preview')
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
    expect(controls.project).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
  })

  it('preserves concept captions and full images when mapping Sanity media to the property view', async () => {
    const builder = {
      ignoreImageParams: vi.fn().mockReturnThis(),
      width: vi.fn().mockReturnThis(),
      height: vi.fn().mockReturnThis(),
      fit: vi.fn().mockReturnThis(),
      url: vi.fn().mockReturnValue('/resolved-concept.jpg'),
    }
    controls.urlFor.mockReturnValue(builder)
    controls.fetch.mockResolvedValue({ data: {
      ...property,
      featuredImage: { alt: 'Proposal', caption: 'Proposed interior — AI-assisted concept; not completed works', mediaKind: 'concept' },
      gallery: [{ alt: 'Comparison', mediaKind: 'concept-comparison' }],
    } })
    const page = await PropertyDetailPage({ params: Promise.resolve({ slug: property.slug }) })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Proposed interior — AI-assisted concept; not completed works</p>')
    expect(html).toContain('Existing view and proposed interiors — AI-assisted concept; not completed works</figcaption>')
    expect(html.match(/class="object-contain"/g)).toHaveLength(2)
    expect(builder.ignoreImageParams).toHaveBeenCalledTimes(2)
    expect(builder.height).not.toHaveBeenCalled()
    expect(builder.fit).toHaveBeenCalledWith('max')
  })

  it.each(['drafts.property-florence', 'versions.release.property-florence'])(
    'does not expose public actions for an unpublished Sanity ID (%s)',
    (_id) => {
      const html = renderToStaticMarkup(<PropertyDetailView property={{ ...property, _id }} media={media} />)
      expect(html).toContain('Enquiries disabled in preview')
      expect(html).not.toContain('How protected payment works')
      expect(controls.save).not.toHaveBeenCalled()
      expect(controls.share).not.toHaveBeenCalled()
      expect(controls.project).not.toHaveBeenCalled()
      expect(controls.lead).not.toHaveBeenCalled()
    },
  )

  it('passes Draft Mode through the page even when Sanity normalizes the document ID', async () => {
    controls.draftMode.mockResolvedValue({ isEnabled: true })
    const page = await PropertyDetailPage({ params: Promise.resolve({ slug: property.slug }) })
    const html = renderToStaticMarkup(page)
    expect(html).toContain('Sanity preview')
    expect(html).toContain('Enquiries disabled in preview')
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
  })

  it('keeps rent-only enquiries while omitting purchase guidance', () => {
    const html = renderToStaticMarkup(
      <PropertyDetailView property={{ ...property, listingType: ['rent'] }} media={media} />,
    )
    expect(html).not.toContain('How protected payment works')
    expect(html).not.toContain('href="/mortgage-calculator"')
    expect(controls.lead).toHaveBeenCalledWith(expect.objectContaining({ interest: 'rent' }))
    expect(controls.save).toHaveBeenCalled()
  })

  it('respects the purchase-readiness feature flag', () => {
    vi.stubEnv('PURCHASE_READINESS_ENABLED', 'false')
    const html = renderToStaticMarkup(<PropertyDetailView property={property} media={media} />)
    expect(html).not.toContain('How protected payment works')
    expect(controls.lead).toHaveBeenCalledTimes(1)
  })
})

describe('details carried over from the live site', () => {
  it('renders the Kore schedule, target date and qualified payment plan without invented imagery or figures', () => {
    const draft = JSON.parse(readFileSync(join(process.cwd(), 'scripts/kore-wellness-residence.staging-draft.ndjson'), 'utf8'))
    const kore: PropertyDetail = { ...draft, _id: 'kore-wellness-residence', slug: draft.slug.current }
    const html = renderToStaticMarkup(<PropertyDetailView property={kore} media={{ gallery: [] }} />)
    expect(html).toMatch(/<table[^>]*table-fixed/)
    for (const figure of ['406', '669', '1,406', '679,000', '1,100,000', '1,550,000']) expect(html).toContain(figure)
    expect(html).toContain('Starting size')
    expect(html).toContain('Starting price')
    expect(html).toContain('Target completion')
    expect(html).toContain('Q4 2028')
    expect(html).toContain('Payment plans')
    expect(html).toContain('10% price increase')
    expect(html).toContain('Project imagery unavailable')
    expect(html).not.toMatch(/<img|>Bedrooms<|>Size<|>Floor area<|>Payment<|Built-up area|On application/)
  })

  it('labels a ready home as Ready and names its measured area, without planned-development wording', () => {
    const london: PropertyDetail = {
      _id: 'north-london', title: 'Three-bedroom terraced house in North London', slug: 'north-london-three-bedroom-property',
      community: 'North London', city: 'London', country: 'United Kingdom', unitType: 'Terraced House',
      availability: ['ready'], listingType: ['sale'], bedrooms: 3, priceDisplay: '£500,000',
      sizeDisplay: 'Approx. Gross Internal Floor Area: 889.9 sq ft / 82.67 m²',
      summary: 'A three-bedroom terraced house.', amenities: ['Planned gym'],
      floorPlans: [{ src: '/plan.jpg', alt: 'Supplied floor plan', caption: 'Measurements are approximate and for guidance only.', mediaKind: 'floor-plan' }],
    }
    const html = renderToStaticMarkup(<PropertyDetailView property={london} media={{ gallery: [] }} />)
    expect(html).toContain('Terraced House · Ready')
    expect(html).toContain('>Floor area<')
    expect(html).toContain('£500,000')
    expect(html).toContain('Measurements are approximate and for guidance only.')
    expect(html).not.toMatch(/Plans and images describe a proposed development|Planned community amenities/)
    expect(html).toContain('Planned gym')
  })

  it('identifies an off-plan home as proposed and its amenities as planned, but not a part-ready one', () => {
    const offPlan: PropertyDetail = { ...property, _id: 'off-plan-home', amenities: ['Planned swimming pool', 'Clubhouse'] }
    const html = renderToStaticMarkup(<PropertyDetailView property={offPlan} media={media} />)
    expect(html).toContain('Plans and images describe a proposed development')
    expect(html).toContain('Planned community amenities')
    expect(html).toContain('>swimming pool<')
    expect(html).not.toContain('Planned swimming pool')

    const mixed = renderToStaticMarkup(<PropertyDetailView property={{ ...offPlan, availability: ['ready', 'off-plan'] }} media={media} />)
    expect(mixed).not.toMatch(/Plans and images describe a proposed development|Planned community amenities/)
  })

  it('heads a mixed gallery plainly and captions only its concept image', () => {
    const mixedMedia: PropertyMedia = { gallery: [
      { src: '/photo.jpg', alt: 'Street view', mediaKind: 'photo' },
      { src: '/concept.jpg', alt: 'Kitchen concept', mediaKind: 'concept' },
    ] }
    const html = renderToStaticMarkup(<PropertyDetailView property={{ ...property, availability: ['ready'] }} media={mixedMedia} />)
    expect(html).toMatch(/<h2[^>]*>\s*Gallery\s*<\/h2>/)
    expect(html.match(/AI-assisted concept; not completed works/g)).toHaveLength(1)

    const concepts = renderToStaticMarkup(<PropertyDetailView property={{ ...property, availability: ['ready'] }}
      media={{ gallery: [mixedMedia.gallery[1]] }} />)
    expect(concepts).toMatch(/<h2[^>]*>\s*Proposed interiors\s*<\/h2>/)
  })
})

