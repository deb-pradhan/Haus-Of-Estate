import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createImageUrlBuilder } from '@sanity/image-url'
import ts from 'typescript'
import * as media from '../src/lib/property-media.ts'
import * as taxonomy from '../src/lib/property-taxonomy.ts'
import * as seo from '../src/lib/seo.ts'

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
// The page de-duplicates by Sanity asset, so each distinct picture needs its own asset reference.
const asset = (id) => ({ _type: 'reference', _ref: `image-${id}-1536x1024-jpg` })
const conceptKitchen = {
  ...board,
  asset: asset('a1b2c3d4e5f60718293a4b5c6d7e8f9012345678'),
  mediaKind: 'concept',
  alt: 'Kitchen concept',
  caption: undefined,
}
const photo = {
  ...board,
  asset: asset('0f1e2d3c4b5a69788796a5b4c3d2e1f001234567'),
  mediaKind: 'photo',
  alt: 'Front elevation',
  caption: undefined,
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
  gallery: [conceptKitchen],
  floorPlans: [{ src: planUrl, alt: 'Supplied floor plan', caption: 'Measurements are approximate and for guidance only.', mediaKind: 'floor-plan' }],
}

// Render the real property components to static HTML. Only framework/data
// boundaries are stubbed. Production media, taxonomy and formatting logic, the
// card, grid, gallery, status badges and the detail page all execute unchanged:
// anything under the allow-listed '@/' prefixes (and relative imports) is
// transpiled and loaded from src/. Unknown '@/' ids still crash on purpose, so a
// new import cannot silently bypass the rules under test.
const srcRoot = fileURLToPath(new URL('../src/', import.meta.url))
const realPrefixes = [
  '@/components/property/',
  '@/components/properties/',
  '@/components/legal/risk-warning',
  '@/components/seo/json-ld',
  '@/components/ui/button',
  '@/components/ui/reveal',
  '@/lib/analytics',
  '@/lib/property-format',
  '@/lib/site-claims',
  '@/lib/utils',
]
const galleryProps = []
const enquiryContexts = []

function resolveSource(id, fromDir) {
  const base = id.startsWith('@/') ? join(srcRoot, id.slice(2)) : resolve(fromDir, id)
  for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`Cannot resolve ${id}`)
}

function loadFile(file, stubs, cache) {
  if (cache.has(file)) return cache.get(file)
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  })
  const exports = {}
  cache.set(file, exports)
  const requireFrom = (id) => {
    if (id in stubs) return stubs[id]
    if (id.startsWith('.') || realPrefixes.some((prefix) => id.startsWith(prefix))) {
      return loadFile(resolveSource(id, dirname(file)), stubs, cache)
    }
    return require(id)
  }
  new Function('require', 'exports', outputText)(requireFrom, exports)
  return exports
}

async function loadComponent(relativePath, property = london) {
  const element = (tag) => function StubElement({ children, ...props }) {
    delete props.asChild
    return createElement(tag, props, children)
  }
  const nothing = () => null
  const stubs = {
    'next/navigation': { notFound: () => { throw new Error('not found') }, useRouter: () => ({ push() {} }) },
    'next/link': { default: element('a') },
    'next/image': { default: ({ src, alt, className }) => createElement('img', { src, alt, className }) },
    '@/sanity': {
      urlFor: (image) => imageBuilder.image(image),
      // The similar-properties query is empty so the only cards rendered are the one under test.
      sanityFetch: async ({ query }) => ({ data: query === 'detail' ? property : query === 'similar' ? [] : [property] }),
    },
    '@/sanity/queries': {
      PROPERTY_BY_SLUG_QUERY: 'detail',
      PROPERTY_SLUGS_QUERY: 'slugs',
      SIMILAR_PROPERTIES_QUERY: 'similar',
      PROPERTIES_QUERY: 'list',
      FEATURED_PROPERTIES_QUERY: 'featured',
    },
    '@/lib/property-media': media,
    '@/lib/property-taxonomy': taxonomy,
    '@/lib/seo': seo,
    '@/lib/embed-video': { toEmbedUrl: () => null },
    '@/components/blog': { PortableTextRenderer: nothing },
    '@/components/media/consent-embed': { ConsentEmbed: nothing },
    '@/components/lead-modal/open-buyer-button': { OpenBuyerButton: element('button') },
    // Interactive client islands with their own browser-only dependencies.
    '@/components/ui/dialog': { Dialog: nothing, DialogClose: nothing, DialogContent: nothing, DialogDescription: nothing, DialogTitle: nothing },
    '@/components/properties/empty-state-cta': { EmptyStateCTA: nothing },
    '@/components/properties/filter-bar': { FilterBar: nothing },
    '@/components/properties/enquiry-form': {
      EnquiryForm: ({ context }) => {
        enquiryContexts.push(context)
        return createElement('form', { 'aria-label': 'Enquiry form', 'data-slug': context.slug })
      },
    },
  }
  // Wrap the real gallery so tests can inspect exactly what the page hands it for every slide.
  const gallery = loadFile(resolveSource('@/components/properties/property-gallery', srcRoot), stubs, new Map())
  stubs['@/components/properties/property-gallery'] = {
    PropertyGallery: (props) => {
      galleryProps.push(props)
      return gallery.PropertyGallery(props)
    },
  }
  galleryProps.length = 0
  enquiryContexts.length = 0
  return loadFile(fileURLToPath(new URL(relativePath, import.meta.url)), stubs, new Map())
}

const detailPath = '../src/app/(main)/properties/[slug]/page.tsx'
const cards = [
  ['catalogue', '../src/components/properties/property-listing.tsx', 'PropertyListing', { params: {} }],
  ['homepage', '../src/components/landing/property-showcase.tsx', 'PropertyShowcase', undefined],
]

// Decorative thumbnails (alt="") repeat the slides above them, so only meaningful images are counted.
function imagesIn(html) {
  return [...html.matchAll(/<img\b[^>]*>/g)].filter(([tag]) => !tag.includes('alt=""')).map(([tag]) => ({
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

const renderDetail = async (property = london) => {
  const page = await loadComponent(detailPath, property)
  return renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: property.slug }) }))
}

test('London detail preserves boards, separate plan, approximate GIA, price and navigation', async () => {
  const html = await renderDetail()
  // Slides in gallery order (featured board, concept kitchen), then the separate floor plan.
  const images = imagesIn(html)
  assert.equal(images.length, 3)
  assertCompleteConcept(images[0])
  assertCompleteConcept(images[1])
  assert.equal(images[2].url.href, planUrl)
  assert.match(images[2].tag, /class="object-contain"/)
  assert.ok(html.includes(`href="${planUrl}" target="_blank" rel="noopener noreferrer"`))
  // The current slide's caption is visible; every slide hands the gallery its own disclosure.
  const slides = galleryProps[0].images
  assert.deepEqual(slides.map(({ concept }) => concept), [true, true])
  assert.equal(slides[0].caption, board.caption)
  assert.match(slides[1].caption, /Proposed interiors — AI-assisted concept; not completed works/)
  for (const text of [board.caption, london.sizeDisplay, london.priceDisplay, 'Terraced House', 'Ready', 'Floor plan', 'Measurements are approximate and for guidance only.']) {
    assert.ok(html.includes(text), text)
  }
  assert.match(html, /aria-label="Breadcrumb"/)
  assert.match(html, /href="\/"[^>]*>Home/)
  assert.match(html, /href="\/properties"[^>]*>Properties/)
  assert.match(html, /aria-current="page"/)
  // The mailto: link was replaced by an inline enquiry form and a WhatsApp link.
  assert.match(html, /<form[^>]*aria-label="Enquiry form"/)
  assert.deepEqual(enquiryContexts.map(({ slug }) => slug), [london.slug])
  assert.match(html, /aria-label="Request a viewing"/)
  assert.match(html, />Request a viewing</)
  const whatsapp = html.match(/<a href="(https:\/\/wa\.me\/[^"]+)"[^>]*>/)
  assert.ok(whatsapp, 'WhatsApp link')
  assert.match(whatsapp[0], /target="_blank" rel="noopener noreferrer"/)
  assert.ok(decodeURIComponent(whatsapp[1].replaceAll('&amp;', '&')).includes(london.title))
  assert.doesNotMatch(html, /href="mailto:/)
  assert.doesNotMatch(html, />Bathrooms<|>Plot<|>Unit<|>Completed<|>EPC<|>Tenure</)
})

test('detail shows the standard concept label when the Studio caption is missing', async () => {
  const html = await renderDetail({ ...london, featuredImage: { ...board, caption: undefined } })
  assert.match(html, /Existing view and proposed interiors — AI-assisted concept; not completed works/)
  assert.doesNotMatch(html, /<img[^>]*(?:h=|rect=)/)
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
    // A concept board never gets an overlay badge that could cover its labels; the badge sits beside the caption.
    assert.doesNotMatch(html, /absolute left-3 top-3/)
    assert.match(html, /<figcaption[^>]*>(?:(?!<\/figcaption>).)*>Ready</s)
    assert.doesNotMatch(html, />Bathrooms|>Plot|>Tenure|>Completed</)
  })

  test(`${name} retains existing photo crops, hover behaviour and off-plan status`, async () => {
    const property = { ...london, availability: ['off-plan'], completionStatus: 'off-plan', featuredImage: { ...board, mediaKind: undefined, caption: undefined } }
    const component = await loadComponent(path, property)
    const html = renderToStaticMarkup(await component[exportName](props))
    const [image] = imagesIn(html)
    assert.equal(image.url.searchParams.get('w'), '800')
    assert.equal(image.url.searchParams.get('h'), '600')
    assert.match(image.tag, /object-cover.*group-hover:scale-\[1\.03\]/)
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
  const html = await renderDetail({ ...london, featuredImage: photo, gallery: [conceptKitchen, { ...photo, asset: asset('beefbeefbeefbeefbeefbeefbeefbeefbeefbeef'), alt: 'Rear garden' }] })
  assert.match(html, /aria-label="Photos of Three-bedroom terraced house in North London"/)
  const slides = galleryProps[0].images
  assert.deepEqual(slides.map(({ concept }) => concept), [false, true, false])
  assert.deepEqual(slides.map(({ caption }) => Boolean(caption)), [false, true, false])
  assert.match(slides[1].caption, /AI-assisted concept; not completed works/)
  // The first, ordinary photo is on screen: it is cropped and carries no concept label.
  assert.doesNotMatch(html, /AI-assisted concept/)
  const slideImages = imagesIn(html).filter(({ url }) => url.pathname.includes('/images/') && !url.href.includes('3b5e8edf'))
  assert.deepEqual(slideImages.map(({ tag }) => /class="object-cover"/.test(tag)), [true, false, true])
})

test('missing concept captions retain disclosure without relabelling ordinary photos or plans', () => {
  assert.match(media.propertyMediaCaption({ mediaKind: 'concept', caption: '   ' }), /AI-assisted concept; not completed works/)
  assert.match(media.propertyMediaCaption({ mediaKind: 'concept-comparison' }), /Existing view and proposed interiors/)
  assert.equal(media.propertyMediaCaption({ mediaKind: 'photo' }), undefined)
  assert.equal(media.isConceptMedia({ mediaKind: 'floor-plan' }), false)
  assert.ok(taxonomy.TYPES_BY_CATEGORY.residential.includes('Terraced House'))
  assert.ok(taxonomy.ALL_UNIT_TYPES.includes('Terraced House'))
})
