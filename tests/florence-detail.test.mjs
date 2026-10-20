import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createImageUrlBuilder } from '@sanity/image-url'
import ts from 'typescript'
import * as media from '../src/lib/property-media.ts'
import * as designs from '../src/lib/property-designs.ts'
import * as developments from '../src/lib/property-developments.ts'
import * as seo from '../src/lib/seo.ts'

const require = createRequire(import.meta.url)
const builder = createImageUrlBuilder({ projectId: 'jdxbkry4', dataset: 'production' })
const image = {
  asset: { _ref: 'image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1600x900-jpg' },
  alt: 'Florence community — artist’s impression',
}
const exterior = 'https://cdn.sanity.io/images/jdxbkry4/production/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb-1600x900.jpg'
const plan = 'https://cdn.sanity.io/images/jdxbkry4/production/cccccccccccccccccccccccccccccccccccccccc-1200x1800.jpg'
const homeDesign = {
  _key: 'villa-a',
  label: 'Villa A',
  position: 'standalone',
  sellableAreaSqFt: 4500.25,
  plotAreaSqFt: 6000.5,
  plotAreaStatus: 'brochure',
  images: [{ src: exterior, alt: 'Villa A exterior', label: 'Villa A — supplied design' }],
  floorPlans: [{ src: plan, alt: 'Villa A full ground and first floor plan', label: 'Ground and first floor' }],
}
const overview = {
  _id: 'florence',
  title: 'Azizi Florence',
  slug: 'azizi-florence',
  unitType: 'Development',
  community: 'Florence',
  city: 'Sharjah',
  country: 'United Arab Emirates',
  summary: 'A community of villas and townhouses.',
  featuredImage: image,
  collections: [],
}
const collection = {
  ...overview,
  _id: 'villa-4',
  slug: 'azizi-florence-4-bedroom-villas',
  title: 'Azizi Florence 4-bedroom villas',
  unitType: 'Villa',
  bedrooms: 4,
  masterDevelopment: overview.title,
  priceDisplay: 'From AED 3,000,000 — Clusters 1 & 2',
  priceAmount: 3000000,
  priceCurrency: 'AED',
  designCount: 1,
  designImage: { src: exterior, alt: 'Villa A exterior', label: 'Villa A' },
  designVariants: [homeDesign],
  interiorSchemes: [{
    _key: 'warm',
    label: 'Warm scheme',
    images: [{ src: exterior, alt: 'Warm interior scheme from brochure' }],
  }],
}
const community = {
  ...overview,
  collections: [collection, {
    ...collection,
    _id: 'townhouse-3',
    slug: 'azizi-florence-3-bedroom-townhouses',
    title: 'Azizi Florence 3-bedroom townhouses',
    unitType: 'Townhouse',
    bedrooms: 3,
    priceDisplay: 'From AED 1,800,000 — Clusters 1 & 2',
  }],
}

// Run the real components and sanitizers; substitute only framework/data boundaries.
function loadComponent(relativePath, { property = collection, publishedDevelopments = [community], captureDesigns } = {}) {
  const stubs = {
    'next/navigation': { notFound: () => { throw new Error('not found') } },
    'next/link': { default: ({ children, ...props }) => createElement('a', props, children) },
    'next/image': { default: ({ src, alt, className }) => createElement('img', { src, alt, className }) },
    '@/sanity': {
      urlFor: (source) => builder.image(source),
      sanityFetch: async ({ query }) => ({ data: query === 'detail' ? property : publishedDevelopments }),
    },
    '@/sanity/queries': {
      PROPERTY_BY_SLUG_QUERY: 'detail',
      PROPERTY_DEVELOPMENTS_QUERY: 'developments',
    },
    '@/lib/property-media': media,
    '@/lib/property-designs': designs,
    '@/lib/property-developments': developments,
    '@/lib/seo': seo,
    '@/lib/embed-video': { toEmbedUrl: () => null },
    '@/components/blog': { PortableTextRenderer: () => null },
  }
  const paths = {
    '@/components/properties/PropertyDetailView': '../src/components/properties/PropertyDetailView.tsx',
    './PropertyDesignExplorer': '../src/components/properties/PropertyDesignExplorer.tsx',
    './property-development': '../src/components/properties/property-development.tsx',
  }
  function load(path) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    })
    const exports = {}
    new Function('require', 'exports', outputText)((id) => {
      if (stubs[id]) return stubs[id]
      if (paths[id]) {
        const componentModule = load(paths[id])
        if (id === './PropertyDesignExplorer' && captureDesigns) {
          return { PropertyDesignExplorer: (props) => {
            captureDesigns(props)
            return createElement(componentModule.PropertyDesignExplorer, props)
          } }
        }
        return componentModule
      }
      return require(id)
    }, exports)
    return exports
  }
  return load(relativePath)
}
const detailPath = '../src/components/properties/PropertyDetailView.tsx'
const routePath = '../src/app/(main)/properties/[slug]/page.tsx'

test('community shows one title, a wide hero and separate Villas and Townhouses with source AED prices', () => {
  const { PropertyDetailView } = loadComponent(detailPath)
  const html = renderToStaticMarkup(createElement(PropertyDetailView, { property: overview, development: community }))
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1)
  assert.match(html, /aspect-\[16\/9\] max-h-\[520px\]/)
  assert.match(html, /id="villas"/)
  assert.match(html, /id="townhouses"/)
  assert.match(html, /href="\/properties\/azizi-florence-4-bedroom-villas"/)
  assert.match(html, /href="\/properties\/azizi-florence-3-bedroom-townhouses"/)
  assert.match(html, /font-serif text-estate-700">From AED 3,000,000 — Clusters 1 &amp; 2/)
  assert.match(html, /Shown: Villa A/)
  assert.doesNotMatch(html, /Price on application|Pricing on enquiry|On application/)
})

test('collection keeps matching images, source areas, full plans, parent links and a design-specific email enquiry', () => {
  const { PropertyDetailView } = loadComponent(detailPath)
  const html = renderToStaticMarkup(createElement(PropertyDetailView, { property: collection, parentDevelopment: community }))
  assert.match(html, /aria-label="Breadcrumb"/)
  assert.equal((html.match(/href="\/properties\/azizi-florence"/g) ?? []).length, 2)
  assert.match(html, /alt="Villa A exterior"[^>]*class="object-contain"/)
  assert.match(html, /6,000\.5 sq ft/)
  assert.match(html, /4,500\.25 sq ft/)
  assert.ok(html.includes(`href="${plan}" target="_blank" rel="noopener noreferrer"`))
  assert.match(html, /alt="Villa A full ground and first floor plan"[^>]*class="object-contain"/)
  assert.match(html, /Whether a scheme can be chosen, which homes it applies to and what is included are awaiting confirmation/)
  assert.ok(html.includes(encodeURIComponent(`Enquiry — ${collection.title} — ${homeDesign.label}`)))
  assert.doesNotMatch(html, /Request.*brochure|fullPDF|>Payment<|Ready|Off-plan/)
})

test('conflicting plot figures and internal fields stay private while audited plans remain available', () => {
  let clientProps
  const conflict = {
    ...collection,
    designVariants: [{
      ...homeDesign,
      plotAreaStatus: 'conflict',
      plotAreaSqFt: 98765,
      areaNote: 'Internal area discrepancy',
      brochureKey: 'internal-only.pdf',
      sourceNotes: 'Private source notes',
    }],
  }
  const { PropertyDetailView } = loadComponent(detailPath, { captureDesigns: (props) => { clientProps = props } })
  const html = renderToStaticMarkup(createElement(PropertyDetailView, { property: conflict }))
  const serialized = JSON.stringify(clientProps)
  assert.doesNotMatch(serialized, /98765|Internal area discrepancy|internal-only\.pdf|Private source notes/)
  assert.ok(serialized.includes(plan))
  assert.ok(html.includes(`href="${plan}"`))
  assert.doesNotMatch(html, /Plot area|Awaiting confirmation/)
  assert.match(html, /4,500\.25 sq ft/)
})

test('missing areas and commercial facts do not produce placeholder labels or inferred availability', () => {
  const property = {
    ...collection,
    priceDisplay: undefined,
    availability: ['ready'],
    designVariants: [{ ...homeDesign, plotAreaSqFt: undefined, sellableAreaSqFt: undefined }],
  }
  const { PropertyDetailView } = loadComponent(detailPath)
  const html = renderToStaticMarkup(createElement(PropertyDetailView, { property }))
  assert.doesNotMatch(html, /Plot area|Built-up area|NaN|Price on application|Ready|Off-plan|>Payment</)
})

test('preview renderer disables mailto enquiries while preserving plan inspection', () => {
  const { PropertyDetailView } = loadComponent(detailPath)
  const html = renderToStaticMarkup(createElement(PropertyDetailView, { property: collection, parentDevelopment: community, preview: true }))
  assert.doesNotMatch(html, /mailto:/)
  assert.ok(html.includes(`href="${plan}"`))
  assert.match(html, /href="\/dev\/florence-preview\/azizi-florence"/)
  const communityHtml = renderToStaticMarkup(createElement(PropertyDetailView, { property: overview, development: community, preview: true }))
  assert.match(communityHtml, /href="\/dev\/florence-preview\/azizi-florence-4-bedroom-villas"/)
})

test('detail route has no parent link when the strict public development query returns no parent', async () => {
  const page = loadComponent(routePath, { publishedDevelopments: [] })
  const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: collection.slug }) }))
  assert.doesNotMatch(html, /href="\/properties\/azizi-florence"/)
  assert.match(html, /aria-current="page"/)
})
