import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../../../src/components/properties/PropertyPriceText.tsx', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
})
const component = {}
new Function('require', 'exports', outputText)(require, component)
const render = (text) => renderToStaticMarkup(createElement(component.PropertyPriceText, { text }))
const textContent = (html) => html.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&')
const visibleText = (html) => textContent(html.replace(/<span class="sr-only">.*?<\/span>/g, ''))

test('AED prices render the supplied central-bank artwork with an accessible currency label', () => {
  const html = render('From AED 679,000')
  assert.match(html, /<image href="\/currency\/uae-dirham\.png"/)
  assert.match(html, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/)
  assert.match(html, /<span class="sr-only">AED <\/span>/)
  assert.equal(textContent(html), 'From AED 679,000')
  assert.equal(visibleText(html), 'From 679,000')

  // Ensure the rendered URL resolves to the supplied image, not a missing icon.
  const artwork = readFileSync(new URL('../../../public/currency/uae-dirham.png', import.meta.url))
  assert.deepEqual([...artwork.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  assert.equal(artwork.readUInt32BE(16), 700)
  assert.equal(artwork.readUInt32BE(20), 700)
})

test('Florence ranges keep their exact figures and cluster qualification', () => {
  const supplied = 'From AED 3,350,000–5,115,000 · Clusters 1 & 2'
  const html = render(supplied)
  assert.equal(textContent(html), supplied)
  assert.equal(visibleText(html), 'From 3,350,000–5,115,000 · Clusters 1 & 2')
  assert.equal((html.match(/<image /g) ?? []).length, 1)
})

test('rent periods, decimal amounts and repeated AED prices are preserved without conversion', () => {
  const supplied = 'AED 80,000 / year; AED 6,666.67 per month'
  const html = render(supplied)
  assert.equal(textContent(html), supplied)
  assert.equal(visibleText(html), '80,000 / year; 6,666.67 per month')
  assert.equal((html.match(/<image /g) ?? []).length, 2)
})

test('GBP and USD prices retain their original symbols, codes, figures and qualifiers', () => {
  for (const supplied of ['£500,000', 'From GBP 500,000', '$679,000', 'USD 1,100,000 / year']) {
    const html = render(supplied)
    assert.equal(textContent(html), supplied)
    assert.equal(visibleText(html), supplied)
    assert.doesNotMatch(html, /<svg|<image|sr-only/)
  }
})

test('non-price currency references and missing-price copy are not rewritten into prices', () => {
  for (const supplied of ['Price on application', 'Prices shown in AED', 'AED — awaiting confirmation', '']) {
    const html = render(supplied)
    assert.equal(textContent(html), supplied)
    assert.doesNotMatch(html, /<svg|<image|sr-only/)
  }
})
