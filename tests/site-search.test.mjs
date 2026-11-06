import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { evaluate, parse } from 'groq-js'
import ts from 'typescript'
import * as search from '../src/lib/site-search.ts'

const require = createRequire(import.meta.url)

async function load(relative, stubs = {}) {
  const source = await readFile(new URL(relative, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  })
  const exports = {}
  new Function('require', 'exports', outputText)((id) => stubs[id] ?? require(id), exports)
  return exports
}

const { SITE_SEARCH_QUERY, PROPERTY_LOCATION_OPTIONS_QUERY } = await load('../src/sanity/queries.ts', {
  '@/lib/career-roles': { APPROVED_CAREER_ROLES: [] },
  '@/lib/company-identity': { COMPANY_IDENTITY: { name: 'Haus of Estate' } },
})
const link = { default: ({ children, ...props }) => createElement('a', props, children) }
const items = [
  { _id: 'london', _type: 'property', title: 'Three-bedroom terraced house', slug: 'london-house', city: 'London', summary: 'Courtyard aspect', community: 'North London', unitType: 'Terraced House' },
  { _id: 'article', _type: 'post', title: 'Buying in London', slug: 'buying-london', summary: 'A guide to property purchases' },
  { _id: 'dubai', _type: 'property', title: 'Monaco Mansions', slug: 'monaco', city: 'Dubai' },
  { _id: 'drafts.hidden', _type: 'post', title: 'London draft', slug: 'hidden' },
  { _id: 'versions.release.hidden', _type: 'property', title: 'London release', slug: 'hidden' },
]

async function pageWith(data) {
  const calls = []
  const page = await load('../src/app/(main)/search/page.tsx', {
    'next/link': link,
    '@/sanity/live': { sanityFetch: async (args) => { calls.push(args); return { data } } },
    '@/sanity/queries': { SITE_SEARCH_QUERY },
    '@/lib/site-search': search,
  })
  return { ...page, calls, render: async (q) => renderToStaticMarkup(await page.default({ searchParams: Promise.resolve({ q }) })) }
}

test('summary search matches both content types and all words, with literal wildcard characters', () => {
  assert.deepEqual(search.searchPublicSummaries(items, 'LONDON').map((item) => item._id), ['london', 'article'])
  assert.deepEqual(search.searchPublicSummaries(items, 'london courtyard').map((item) => item._id), ['london'])
  assert.deepEqual(search.searchPublicSummaries(items, 'terraced house').map((item) => item._id), ['london'])
  for (const query of ['nonexistent', ' ', '*', 'London Dubai']) assert.deepEqual(search.searchPublicSummaries(items, query), [])
})

test('query normalization bounds repeated and empty parameters', () => {
  assert.equal(search.normalizeSearchQuery(['  North\nLondon ', 'ignored']), 'North London')
  assert.equal(search.normalizeSearchQuery([]), '')
  assert.equal(search.normalizeSearchQuery(undefined), '')
  assert.equal(search.normalizeSearchQuery('x'.repeat(300)).length, 120)
})

test('location options use public discoverable listings even in a draft perspective', async () => {
  const item = (id, overrides = {}) => ({ _id: id, _type: 'property', status: 'published',
    slug: { current: id }, country: 'United Kingdom', city: 'London', community: id, ...overrides })
  const dataset = [item('North London'), item('reserved', { listingState: 'reserved' }),
    item('drafts.hidden'), item('versions.release.hidden'),
    item('normalized-draft', { _originalId: 'drafts.hidden' }),
    item('normalized-version', { _originalId: 'versions.release.hidden' }),
    item('unpublished', { status: 'draft' }), item('sold', { listingState: 'sold' }),
    item('withdrawn', { listingState: 'withdrawn' }), item('missing-slug', { slug: undefined }),
    item('empty-slug', { slug: { current: '' } })]
  const results = await (await evaluate(parse(PROPERTY_LOCATION_OPTIONS_QUERY), { dataset })).get()
  assert.deepEqual(results.map((record) => record.community), ['North London', 'reserved'])
  assert.deepEqual(Object.keys(results[0]).sort(), ['city', 'community', 'country'])
})

test('actual discovery query excludes unpublished, normalized draft/version and withdrawn records and private fields', async () => {
  const document = (id, fields = {}) => ({
    _id: id, _type: 'property', status: 'published', title: id, slug: { current: id },
    listingState: 'active', summary: 'Public summary', publishedAt: '2026-10-29T00:00:00Z',
    email: 'private@example.com', phone: 'private', address: 'private', verification: { notes: 'private' },
    body: [{ text: 'private' }], floorPlans: [{ private: true }], ...fields,
  })
  const dataset = [
    document('active'), document('reserved', { listingState: 'reserved' }),
    document('under-offer', { listingState: 'under_offer' }), document('legacy', { listingState: undefined }),
    document('article', { _type: 'post', summary: undefined, subtitle: 'Public article subtitle' }),
    document('withdrawn', { listingState: 'withdrawn' }), document('sold', { listingState: 'sold' }),
    document('unpublished', { status: 'draft' }), document('drafts.native'), document('versions.release.native'),
    document('normalized-draft', { _originalId: 'drafts.normalized-draft' }),
    document('normalized-version', { _originalId: 'versions.release.normalized-version' }),
    document('normalized-post', { _type: 'post', _originalId: 'drafts.normalized-post' }),
    document('other-type', { _type: 'role' }), document('missing-slug', { slug: undefined }),
    document('empty-slug', { slug: { current: '' } }), document('missing-title', { title: undefined }),
  ]
  const results = await (await evaluate(parse(SITE_SEARCH_QUERY), { dataset })).get()
  assert.deepEqual(results.map(({ _id }) => _id).sort(), ['active', 'article', 'legacy', 'reserved', 'under-offer'])
  assert.equal(results.find(({ _id }) => _id === 'article').summary, 'Public article subtitle')
  assert.ok(!JSON.stringify(results).includes('private'))
  for (const result of results) assert.deepEqual(Object.keys(result).sort(), [
    '_id', '_type', 'city', 'community', 'country', 'developer', 'slug', 'summary', 'title', 'unitType',
  ].sort())
})

test('empty search does not fetch the catalogue and search metadata stays noindex without the query', async () => {
  const page = await pageWith(items)
  const html = await page.render(' ')
  assert.equal(page.calls.length, 0)
  assert.match(html, /Try a location, development name or article topic/)
  assert.equal(page.metadata.robots.index, false)
  assert.equal(page.metadata.robots.googleBot.index, false)
  assert.deepEqual(page.metadata.alternates, { canonical: '/search' })
  assert.equal(page.metadata.title, 'Search properties and articles')
})

test('rendered results separate articles and properties and retain the query in both refinement links', async () => {
  const page = await pageWith(items)
  const html = await page.render([' LONDON ', 'Dubai'])
  assert.match(html, /2 results for/)
  assert.match(html, /href="\/properties\/london-house"/)
  assert.match(html, /href="\/blog\/buying-london"/)
  assert.match(html, /href="\/properties\?q=LONDON"/)
  assert.match(html, /href="\/blog\?q=LONDON"/)
  assert.doesNotMatch(html, /href="\/properties\/monaco"|London draft|London release/)
  assert.deepEqual(page.calls, [{ query: SITE_SEARCH_QUERY }])
})

test('a fetch outage is distinct from an honest zero-match result', async () => {
  const outage = await pageWith(null)
  const failed = await outage.render('London')
  assert.match(failed, /role="status"/)
  assert.match(failed, /Search is temporarily unavailable/)
  assert.doesNotMatch(failed, /0 results|No matching properties/)
  const empty = await pageWith([])
  const html = await empty.render('London')
  assert.match(html, /0 results/)
  assert.match(html, /No matching properties/)
  assert.match(html, /No matching articles/)
})

test('navbar targets combined search and reflects search URLs while clearing unrelated destinations', async () => {
  let pathname = '/search'
  let params = new URLSearchParams('q=North+London&q=ignored')
  const nav = await load('../src/components/layout/property-navigation.tsx', {
    'next/link': link,
    'next/navigation': { usePathname: () => pathname, useSearchParams: () => params },
    '@/lib/property-markets': { PROPERTY_MARKETS: [], marketLinks: () => [] },
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
    '@/lib/site-search': search,
  })
  const render = () => renderToStaticMarkup(createElement(nav.NavbarPropertySearch))
  assert.match(render(), /action="\/search"/)
  assert.match(render(), /aria-label="Search properties and articles"/)
  assert.match(render(), /value="North London"/)
  pathname = '/properties'
  params = new URLSearchParams('q=Dubai')
  assert.match(render(), /value="Dubai"/)
  pathname = '/about'
  assert.match(render(), /value=""/)
  assert.doesNotMatch(render(), /value="Dubai"/)
})
