#!/usr/bin/env node
// Showcase journey audit.
//
// Drives the fixture showcase end to end in Chromium at 390px and 1440px:
// homepage search → filtered catalogue → empty state → Florence community →
// 4-bedroom townhouse collection → named design → simulated brochure request
// (validation errors, then success with the email preview) → back link →
// North London ready home → 404 states → keyboard focus trail.
//
// It records horizontal overflow, interactive targets under 44px, broken
// images, focus visibility and the simulated-request facts, writes screenshots
// plus report.json to OUT_DIR, and never submits anything real: the showcase
// has no lead or email endpoints to call.
//
// Usage (against a server started with HAUS_FIXTURE_SHOWCASE_ENABLED=true):
//   BASE_URL=http://127.0.0.1:3500 OUT_DIR=./showcase-journey node scripts/showcase-journey-audit.mjs
// Uses the repository's @playwright/test Chromium; set PLAYWRIGHT_CHROMIUM_PATH
// to point at a preinstalled browser. HTTPS_PROXY, when set, is passed to Chromium.
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('@playwright/test')) } catch { ({ chromium } = require('playwright')) }

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3400'
const outDir = path.resolve(process.env.OUT_DIR ?? 'showcase-journey')
await mkdir(outDir, { recursive: true })
const viewports = [
  { name: 'mobile-390', width: 390, height: 844, scale: 2 },
  { name: 'desktop-1440', width: 1440, height: 900, scale: 1 },
]
const report = { base, startedAt: new Date().toISOString(), viewports: {} }
const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
  ...(proxyServer ? { proxy: { server: proxyServer, bypass: '127.0.0.1,localhost' } } : {}),
})

async function audit(page, label, record) {
  const metrics = await page.evaluate(() => {
    const docWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
    const viewportWidth = document.documentElement.clientWidth
    const interactive = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [role="button"]')]
      .filter((el) => {
        const style = getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
    const small = interactive.filter((el) => {
      const rect = el.getBoundingClientRect()
      const inline = getComputedStyle(el).display === 'inline'
      return !inline && (rect.height < 44 || rect.width < 44)
    }).map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`)
    const images = [...document.images]
    const broken = images.filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src')).map((img) => img.getAttribute('src'))
    const unloaded = images.filter((img) => !img.complete).length
    return { docWidth, viewportWidth, overflow: docWidth > viewportWidth, interactiveCount: interactive.length, small, imageCount: images.length, broken, unloaded, title: document.title, h1: document.querySelector('h1')?.textContent?.trim() ?? null }
  })
  record[label] = { ...(record[label] ?? {}), ...metrics }
  return metrics
}

async function shot(page, file, fullPage = true) {
  await page.screenshot({ path: path.join(outDir, file), fullPage })
}

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.scale, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 })
  const page = await context.newPage()
  page.setDefaultTimeout(45000)
  page.setDefaultNavigationTimeout(90000)
  const record = {}
  report.viewports[viewport.name] = record
  const vp = viewport.name
  const failures = []
  record.failures = failures

  const waitImages = async () => {
    await page.waitForLoadState('load', { timeout: 60000 }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {})
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.evaluate(async () => {
          const pending = [...document.images].filter((img) => !img.complete).map((img) => new Promise((resolve) => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }) }))
          await Promise.race([Promise.all(pending), new Promise((resolve) => setTimeout(resolve, 30000))])
        })
        return
      } catch (error) {
        if (!/Execution context was destroyed/.test(String(error))) throw error
        await page.waitForTimeout(500)
      }
    }
  }
  const step = async (name, fn) => {
    try { await fn() } catch (error) { failures.push({ step: name, error: String(error).split('\n')[0] }); console.error(`[${vp}] ${name} failed:`, String(error).split('\n')[0]) }
  }

  await step('1-home', async () => {
    await page.goto(`${base}/showcase`, { waitUntil: 'domcontentloaded' })
    await waitImages()
    await audit(page, '1-home', record)
    await shot(page, `${vp}-01-home.png`)
  })

  await step('2-catalogue-filtered', async () => {
    await page.selectOption('select[name="country"]', 'United Arab Emirates')
    await page.selectOption('select[name="city"]', 'Sharjah')
    await page.selectOption('select[name="area"]', 'Florence')
    await page.selectOption('select[name="type"]', 'Townhouse')
    await page.click('form[role="search"] button[type="submit"]')
    await page.waitForURL(/\/showcase\/properties\?/)
    await waitImages()
    await audit(page, '2-catalogue-filtered', record)
    record['2-catalogue-filtered'].url = page.url()
    record['2-catalogue-filtered'].status = await page.locator('p[role="status"]').first().textContent()
    await shot(page, `${vp}-02-catalogue-filtered.png`)
  })

  await step('2b-catalogue-empty', async () => {
    await page.goto(`${base}/showcase/properties?country=United+Kingdom&beds=5`, { waitUntil: 'domcontentloaded' })
    await waitImages()
    await audit(page, '2b-catalogue-empty', record)
    record['2b-catalogue-empty'].status = await page.locator('p[role="status"]').first().textContent()
    await shot(page, `${vp}-02b-catalogue-empty.png`)
    await page.getByRole('link', { name: 'Remove filter 5+ bedrooms' }).click()
    await page.waitForURL(/country=United\+Kingdom$/)
    await waitImages()
    record['2b-catalogue-empty'].afterRemovingBeds = await page.locator('p[role="status"]').first().textContent()
  })

  await step('3-community', async () => {
    await page.goto(`${base}/showcase/properties/azizi-florence`, { waitUntil: 'domcontentloaded' })
    await waitImages()
    await audit(page, '3-community', record)
    record['3-community'].sections = await page.evaluate(() => [...document.querySelectorAll('section[id]')].map((s) => s.id))
    await shot(page, `${vp}-03-community.png`)
  })

  await step('4-collection', async () => {
    await page.getByRole('link', { name: /4-bedroom townhouses: compare/ }).click()
    await page.waitForURL(/azizi-florence-4-bedroom-townhouses/)
    await waitImages()
    await audit(page, '4-collection', record)
    await shot(page, `${vp}-04-collection.png`)
  })

  await step('5-design', async () => {
    await page.getByRole('button', { name: 'Spada - 4-home row - corner' }).click()
    await page.waitForFunction(() => new URL(location.href).searchParams.get('design') === 'spada-4-home-corner')
    await waitImages()
    record['5-design'] = { selected: (await page.locator('#selected-design').textContent())?.slice(0, 80), url: page.url() }
    await page.locator('#selected-design').scrollIntoViewIfNeeded()
    await shot(page, `${vp}-05-design-selected.png`)
    if (viewport.width < 600) {
      await page.evaluate(() => window.scrollTo(0, 400))
      await page.waitForTimeout(500)
      record['5-design'].stickyBarVisible = await page.evaluate(() => { const bar = document.querySelector('.sc-safe-bottom'); if (!bar) return false; const r = bar.getBoundingClientRect(); return r.top < innerHeight - 10 })
      await shot(page, `${vp}-05b-design-mobile-bar.png`, false)
    }
    await page.getByRole('button', { name: 'Novoli - 4-home row - corner' }).click()
    await page.waitForFunction(() => new URL(location.href).searchParams.get('design') === 'novoli-4-home-corner')
    record['5-design'].withheld = await page.locator('#designs').textContent().then((t) => /Withheld/.test(t ?? ''))
    await page.getByRole('button', { name: 'Spada - 4-home row - corner' }).click()
    await page.waitForFunction(() => new URL(location.href).searchParams.get('design') === 'spada-4-home-corner')
  })

  await step('6-request-form', async () => {
    const cta = page.locator('#designs').getByRole('link', { name: 'Request the brochure' })
    await cta.focus()
    await shot(page, `${vp}-06-focus-cta.png`, false)
    await cta.click()
    await page.waitForURL(/\/request\?design=spada-4-home-corner/)
    await waitImages()
    await audit(page, '6-request-form', record)
    await shot(page, `${vp}-06-request-form.png`)
    await page.getByRole('button', { name: 'Preview the brochure email' }).click()
    await page.waitForSelector('[role="alert"]')
    record['6-request-form'].errors = await page.locator('[role="alert"] li').allTextContents()
    record['6-request-form'].focusedAfterError = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
    await shot(page, `${vp}-07-request-errors.png`)
  })

  await step('7-success', async () => {
    await page.fill('input[name="firstName"]', 'Sample')
    await page.fill('input[name="email"]', 'sample.buyer@example.com')
    record['6-request-form'].checkboxesBeforeSubmit = await page.evaluate(() => [...document.querySelectorAll('input[type="checkbox"]')].map((el) => ({ id: el.id.slice(-14), required: el.required, checked: el.checked })))
    await page.check('input[type="checkbox"][required]')
    await page.keyboard.press('Tab')
    await shot(page, `${vp}-08-request-focus-optin.png`, false)
    await page.getByRole('button', { name: 'Preview the brochure email' }).click()
    await page.waitForSelector('iframe[title^="Preview of the brochure email"]')
    await page.waitForTimeout(1000)
    await audit(page, '7-success', record)
    record['7-success'].heading = await page.locator('h2').filter({ hasText: 'Here is the email' }).textContent()
    record['7-success'].subject = await page.locator('dd').filter({ hasText: 'Your requested brochure' }).first().textContent()
    record['7-success'].design = await page.locator('dd').filter({ hasText: 'Spada - 4-home row - corner' }).first().textContent()
    record['7-success'].optIns = await page.locator('dd').filter({ hasText: 'subscription' }).first().textContent()
    record['7-success'].focused = await page.evaluate(() => document.activeElement?.textContent?.slice(0, 60))
    const frame = page.frames().find((f) => f !== page.mainFrame())
    record['7-success'].emailMentionsDesign = frame ? await frame.evaluate(() => document.body.innerText.includes('Spada - 4-home row - corner')).catch((e) => `n/a ${String(e).slice(0, 60)}`) : 'no frame'
    await shot(page, `${vp}-09-request-success-email.png`)
  })

  await step('8-back', async () => {
    await page.getByRole('link', { name: 'Back to Spada - 4-home row - corner' }).first().click()
    await page.waitForURL(/azizi-florence-4-bedroom-townhouses\?design=spada-4-home-corner/)
    await waitImages()
    record['8-back'] = { url: page.url(), selected: (await page.locator('#selected-design').textContent())?.slice(0, 60) }
  })

  await step('9-london', async () => {
    await page.goto(`${base}/showcase/properties/north-london-three-bedroom-property`, { waitUntil: 'domcontentloaded' })
    await waitImages()
    await audit(page, '9-london', record)
    record['9-london'].price = await page.locator('text=£500,000').first().textContent()
    await shot(page, `${vp}-10-london.png`)
  })

  await step('10-errors', async () => {
    const bad = await page.goto(`${base}/showcase/properties/azizi-florence-4-bedroom-townhouses/request?design=bogus`, { waitUntil: 'domcontentloaded' })
    record['10-errors'] = { invalidDesignStatus: bad?.status(), invalidDesignH1: await page.locator('h1').first().textContent() }
    await shot(page, `${vp}-11-not-found.png`, false)
    const unknown = await page.goto(`${base}/showcase/properties/unknown-slug`, { waitUntil: 'domcontentloaded' })
    record['10-errors'].unknownSlugStatus = unknown?.status()
  })

  await step('11-keyboard', async () => {
    await page.goto(`${base}/showcase`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('load')
    const focusTrail = []
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      focusTrail.push(await page.evaluate(() => { const el = document.activeElement; if (!el) return null; const style = getComputedStyle(el); return { tag: el.tagName.toLowerCase(), text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 } }))
    }
    record['11-keyboard'] = focusTrail
    await shot(page, `${vp}-12-focus-home.png`, false)
  })

  await context.close()
}
await browser.close()
const failures = Object.values(report.viewports).flatMap((record) => record.failures)
const overflow = Object.values(report.viewports).flatMap((record) => Object.entries(record).filter(([, value]) => value && value.overflow).map(([step]) => step))
report.summary = { failures: failures.length, overflowSteps: overflow }
await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(`done: ${failures.length} failed steps, ${overflow.length} overflow steps, output in ${outDir}`)
process.exitCode = failures.length || overflow.length ? 1 : 0
