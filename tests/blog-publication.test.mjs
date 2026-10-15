import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parse, evaluate } from 'groq-js'
import ts from 'typescript'
import { POST_FIELDS } from '../src/sanity/queries.ts'
import * as author from '../src/lib/blog-author.ts'
import * as thumbnail from '../src/lib/blog-thumbnail.ts'

const require = createRequire(import.meta.url)
const legacyAuthor = { name: 'Former individual author', bio: 'Personal biography', avatar: { url: 'https://example.com/private-avatar.jpg' } }
const post = {
  _id: 'test-post', _type: 'post', title: 'Property guide', slug: 'property-guide',
  publishedAt: '2026-09-23T00:00:00Z', author: legacyAuthor,
  featuredImage: { url: 'https://cdn.sanity.io/images/test1234/production/2b6588fc2082791b334c039e7bb914ba868a0cd7-821x957.png' },
}

async function component(name) {
  const source = await readFile(new URL(`../src/components/blog/${name}.tsx`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  })
  const stubs = {
    'next/link': { default: ({ children, ...props }) => createElement('a', props, children) },
    'next/image': { default: ({ src, alt, className, style }) => createElement('img', { src, alt, className, style }) },
    '@/lib/blog-author': author,
    '@/lib/blog-thumbnail': thumbnail,
    '@/sanity/fallbackImages': { FALLBACK_IMAGES: {}, FALLBACK_ALTS: {} },
  }
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((id) => stubs[id] ?? require(id), loaded, loaded.exports)
  return loaded.exports[name]
}

test('post projection exposes only company attribution despite a linked personal author', async () => {
  const dataset = [
    { ...post, author: { _ref: 'former-author' } },
    { _id: 'former-author', _type: 'author', ...legacyAuthor },
  ]
  const result = await (await evaluate(parse(`*[_type == "post"]{${POST_FIELDS}}`), { dataset })).get()
  assert.deepEqual(result[0].author, { name: 'Haus of Estate' })
  assert.doesNotMatch(JSON.stringify(result), /Former individual author|Personal biography|private-avatar/)
  assert.deepEqual(author.BLOG_AUTHOR_JSON_LD, { '@type': 'Organization', name: 'Haus of Estate', url: 'https://hausofestate.com' })
})

test('public cards ignore legacy personal details while framing the approved cover', async () => {
  for (const name of ['BlogCard', 'FeaturedPost', 'AuthorCard']) {
    const Component = await component(name)
    const html = renderToStaticMarkup(createElement(Component, { post, author: legacyAuthor, variant: 'full' }))
    assert.match(html, /Haus of Estate/)
    assert.doesNotMatch(html, /Former individual author|Personal biography|private-avatar/)
    if (name !== 'AuthorCard') assert.match(html, /object-position:center top/)
  }
})

test('thumbnail alignment follows exact Sanity assets and resets for replacements', () => {
  assert.equal(thumbnail.blogThumbnailPosition(`${post.featuredImage.url}?w=900`), 'center top')
  assert.equal(thumbnail.blogThumbnailPosition(post.featuredImage.url.replace('cdn.sanity.io', 'example.com')), 'center')
  assert.equal(thumbnail.blogThumbnailPosition('https://cdn.sanity.io/images/test1234/production/new-cover-1920x1080.jpg'), 'center')
  assert.equal(thumbnail.blogThumbnailPosition('/fallback.jpg'), 'center')
})
