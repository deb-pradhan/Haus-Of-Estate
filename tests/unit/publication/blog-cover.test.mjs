import assert from 'node:assert/strict'
import { test } from 'vitest'
import { resolveBlogCover, blogCoverQuality, DUBAI_ARTICLE_SLUG, DUBAI_CANVA_COVER } from '../../../src/lib/blog-cover.ts'

const previous = 'https://cdn.sanity.io/images/jdxbkry4/production/0452e218d2a9a0702d39bddfed605b040f82a7e5-1920x1080.jpg'

test('the supplied replacement covers the withdrawn article asset, including CDN transforms', () => {
  for (const url of [previous, `${previous}?w=1200&auto=format`]) {
    assert.equal(resolveBlogCover(DUBAI_ARTICLE_SLUG, url, 'old').url, DUBAI_CANVA_COVER)
  }
  assert.equal(blogCoverQuality(DUBAI_CANVA_COVER), 90)
})

test('later editorial changes and unrelated articles remain authoritative', () => {
  const replacement = previous.replace('0452e218', 'f123abcd')
  for (const [slug, url] of [
    [DUBAI_ARTICLE_SLUG, replacement], ['another-article', previous],
    [DUBAI_ARTICLE_SLUG, '/images/new-cover.webp'], [DUBAI_ARTICLE_SLUG, ''],
    [DUBAI_ARTICLE_SLUG, previous.replace('cdn.sanity.io', 'example.com')],
  ]) {
    assert.deepEqual(resolveBlogCover(slug, url, 'Editor alt'), { url, alt: 'Editor alt' })
  }
  assert.equal(blogCoverQuality(replacement), 75)
})
