import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createImageUrlBuilder } from '@sanity/image-url'
import ts from 'typescript'
import * as media from '../src/lib/property-media.ts'
import * as taxonomy from '../src/lib/property-taxonomy.ts'
import * as seo from '../src/lib/seo.ts'
import * as designs from '../src/lib/property-designs.ts'
import * as developments from '../src/lib/property-developments.ts'

const require = createRequire(import.meta.url)
const imageBuilder = createImageUrlBuilder({ projectId: 'jdxbkry4', dataset: 'production' })
const planUrl = 'https://cdn.sanity.io/images/jdxbkry4/production/3b5e8edf9065462a67966e8d9a351fac2727754d-1169x1983.jpg'
const board = {
  _type: 'image',
  asset: { _type: 'reference', _ref: 'image-d30a5319f275fecbf81578aa0990a4eb0d07684b-1536x1024-jpg' },
  // A later Studio crop must not remove the comparison labels.
  crop: { top: 0.2, bottom: 0.2, left: 0.1, right: 0.1 },
  mediaKind: 'concept-comparison',
  alt: 'Existing and proposed interiors',
  caption: 'Panels marked AFTER are AI-assisted concepts, not completed works.',
}
const london = {
  _id: 'property-north-london-three-bedroom',
  title: 'Three-bedroom terraced house in North London',
  slug: 'north-london-three-bedroom-property',
  community: 'North London',
  city: 'London',
  country: 'United Kingdom',
  unitType: 'Terraced House',
  availability: ['ready'],
  listingType: ['sale'],
  bedrooms: 3,
  priceDisplay: '£500,000',
  sizeDisplay: 'Approx. Gross Internal Floor Area: 889.9 sq ft / 82.67 m²',
  summary: 'A three-bedroom terraced house with clearly labelled proposed interiors.',
  featuredImage: board,
  gallery: [{ ...board, mediaKind: 'concept', alt: 'Kitchen concept', caption: undefined }],
  floorPlans: [{ src: planUrl, alt: 'Supplied floor plan', caption: 'Measurements are approximate and for guidance only.', mediaKind: 'floor-plan' }],
}

// Render the existing server components with only framework/data boundaries stubbed.
// The production media rules, taxonomy and Sanity URL builder execute unchanged.
async function loadComponent(relativePath, property = london) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  })
  const element = (tag) => function StubElement({ children, ...props }) {
    return createElement(tag, props, children)
  }
  const stubs = {
    'next/navigation': { notFound: () => { throw new Error('not found') } },
    'next/link': { default: element('a') },
    'next/image': { default: ({ src, alt, className }) => createElement('img', { src, alt, className }) },
    '@/sanity': {
      urlFor: (image) => imageBuilder.image(image),
      sanityFetch: async ({ query }) => ({ data: query === 'detail' ? property : [property] }),
    },
    '@/sanity/queries': { PROPERTY_BY_SLUG_QUERY: 'detail' },
    '@/lib/property-media': media,
    '@/lib/property-designs': designs,
    '@/lib/property-developments': developments,
    '@/lib/property-taxonomy': taxonomy,
    '@/lib/seo': seo,
    '@/lib/embed-video': { toEmbedUrl: () => null },
    '@/components/blog': { PortableTextRenderer: () => null },
    '@/components/properties/empty-state-cta': { EmptyStateCTA: () => null },
    '@/components/properties/breadcrumbs': { Breadcrumbs: () => null },
    '@/components/ui/button': { Button: element('button') },
    '@/components/lead-modal/open-buyer-button': { OpenBuyerButton: element('button') },
  }
  const components = {
    '@/components/properties/PropertyDetailView': '../src/components/properties/PropertyDetailView.tsx',
    './PropertyDesignExplorer': '../src/components/properties/PropertyDesignExplorer.tsx',
    './property-development': '../src/components/properties/property-development.tsx',
  }
  function componentRequire(id) {
    if (stubs[id]) return stubs[id]
    if (!components[id]) return require(id)
    const nestedSource = readFileSync(new URL(components[id], import.meta.url), 'utf8')
    const nested = ts.transpileModule(nestedSource, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    })
    const nestedExports = {}
    new Function('require', 'exports', nested.outputText)(componentRequire, nestedExports)
    return nestedExports
  }
  const exports = {}
  new Function('require', 'exports', outputText)(componentRequire, exports)
  return exports
}

const detailPath = '../src/app/(main)/properties/[slug]/page.tsx'
const cards = [
  ['catalogue', '../src/components/properties/property-listing.tsx', 'PropertyListing', { params: {} }],
  ['homepage', '../src/components/landing/property-showcase.tsx', 'PropertyShowcase', undefined],
]

function imagesIn(html) {
  return [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => ({
    tag,
    url: new URL(tag.match(/src="([^"]+)"/)[1].replaceAll('&amp;', '&')),
  }))
}

function assertCompleteConcept(image) {
  assert.match(image.tag, /class="object-contain"/)
  assert.equal(image.url.searchParams.get('fit'), 'max')
  assert.equal(image.url.searchParams.has('rect'), false)
  assert.equal(image.url.searchParams.has('h'), false)
  assert.doesNotMatch(image.tag, /scale-/)
}

test('London detail preserves boards, separate plan, approximate GIA, price and navigation', async () => {
  const page = await loadComponent(detailPath)
  const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: london.slug }) }))
  const images = imagesIn(html)
  assert.equal(images.length, 3)
  assertCompleteConcept(images[0])
  assertCompleteConcept(images[2])
  assert.equal(images[1].url.href, planUrl)
  assert.match(images[1].tag, /class="object-contain"/)
  assert.ok(html.includes(`href="${planUrl}" target="_blank" rel="noopener noreferrer"`))
  for (const text of [board.caption, 'AI-assisted concept; not completed works', london.sizeDisplay, london.priceDisplay, 'Terraced House', 'Ready', 'Floor plan', 'Proposed interiors', 'Measurements are approximate and for guidance only.']) {
    assert.ok(html.includes(text), text)
  }
  assert.match(html, /aria-label="Breadcrumb"/)
  assert.match(html, /href="\/"[^>]*>Home/)
  assert.match(html, /href="\/properties"[^>]*>Properties/)
  assert.match(html, /aria-current="page"/)
  assert.match(html, /href="mailto:info@hausofestate.com\?subject=/)
  assert.doesNotMatch(html, />Bathrooms<|>Plot<|>Unit<|>Completed<|>EPC<|>Tenure</)
})

for (const [name, path, exportName, props] of cards) {
  test(`${name} preserves the full concept board and displays its caption and Ready status`, async () => {
    const component = await loadComponent(path)
    const html = renderToStaticMarkup(await component[exportName](props))
    assertCompleteConcept(imagesIn(html)[0])
    assert.ok(html.includes(`<figcaption`))
    assert.ok(html.includes(board.caption))
    assert.ok(html.includes(london.priceDisplay))
    assert.match(html, />Ready<|>Ready<\/span>/)
    assert.doesNotMatch(html, /absolute left-3 top-3/)
  })

  test(`${name} retains existing photo crops, hover behaviour and off-plan status`, async () => {
    const property = { ...london, availability: ['off-plan'], completionStatus: 'off-plan', featuredImage: { ...board, mediaKind: undefined, caption: undefined } }
    const component = await loadComponent(path, property)
    const html = renderToStaticMarkup(await component[exportName](props))
    const [image] = imagesIn(html)
    assert.equal(image.url.searchParams.get('w'), '800')
    assert.equal(image.url.searchParams.get('h'), '600')
    assert.match(image.tag, /object-cover.*group-hover:scale-105/)
    assert.match(html, /absolute left-3 top-3/)
    assert.match(html, />Off-plan</)
    assert.doesNotMatch(html, /<figcaption|>Ready</)
  })
}

test('concept social metadata uses the branded image while photos retain their own image', async () => {
  const page = await loadComponent(detailPath)
  const metadata = await page.generateMetadata({ params: Promise.resolve({ slug: london.slug }) })
  assert.deepEqual(metadata.openGraph.images, seo.DEFAULT_OG_IMAGES)
  assert.deepEqual(metadata.twitter.images, [seo.DEFAULT_OG_IMAGE])
  assert.equal(metadata.alternates.canonical, `/properties/${london.slug}`)
  const photoPage = await loadComponent(detailPath, { ...london, featuredImage: { ...board, mediaKind: 'photo' } })
  const photoMetadata = await photoPage.generateMetadata({ params: Promise.resolve({ slug: london.slug }) })
  assert.equal(new URL(photoMetadata.openGraph.images[0].url).searchParams.get('fit'), 'crop')
})

test('a mixed photo and concept gallery labels only the concept, not the entire gallery', async () => {
  const page = await loadComponent(detailPath, {
    ...london,
    gallery: [london.gallery[0], { ...board, mediaKind: 'photo', caption: undefined }],
  })
  const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: london.slug }) }))
  assert.match(html, /<h2[^>]*>Gallery<\/h2>/)
  assert.match(html, /AI-assisted concept; not completed works/)
  assert.equal(imagesIn(html).filter(({ tag }) => tag.includes('object-cover')).length, 1)
})

test('missing concept captions retain disclosure without relabelling ordinary photos or plans', () => {
  assert.match(media.propertyMediaCaption({ mediaKind: 'concept', caption: '   ' }), /AI-assisted concept; not completed works/)
  assert.match(media.propertyMediaCaption({ mediaKind: 'concept-comparison' }), /Existing view and proposed interiors/)
  assert.equal(media.propertyMediaCaption({ mediaKind: 'photo' }), undefined)
  assert.equal(media.isConceptMedia({ mediaKind: 'floor-plan' }), false)
  assert.ok(taxonomy.TYPES_BY_CATEGORY.residential.includes('Terraced House'))
  assert.ok(taxonomy.ALL_UNIT_TYPES.includes('Terraced House'))
})
