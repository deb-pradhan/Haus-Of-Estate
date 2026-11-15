import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { COMPANY_IDENTITY, getAccessibilityEmail, getRegulatoryLines } from './company-identity'
import { RegulationBlock } from '@/components/legal/regulation-block'
import AccessibilityPage from '@/app/(main)/legal/accessibility/page'
import { breadcrumbJsonLd, serializeJsonLd } from './seo'

describe('regulatory details', () => {
  it('states nothing until a registration has been supplied', () => {
    expect(getRegulatoryLines()).toEqual([])
    expect(renderToStaticMarkup(createElement(RegulationBlock, { tone: 'dark' }))).toBe('')
  })

  it('shows each supplied registration, with a membership number only beside its scheme', () => {
    expect(getRegulatoryLines({ redressScheme: 'Example Scheme', redressMembershipNo: 'X123', vatNumber: ' GB000 ' })).toEqual([
      { label: 'Redress scheme', value: 'Example Scheme, membership X123' },
      { label: 'VAT number', value: 'GB000' },
    ])
    // A membership number on its own names no scheme, so it is not shown.
    expect(getRegulatoryLines({ redressMembershipNo: 'X123' })).toEqual([])
  })

  it('keeps the verified company and ICO details unchanged', () => {
    expect(COMPANY_IDENTITY.number).toBe('17188168')
    expect(COMPANY_IDENTITY.icoRegistrationNumber).toBe('ZC254915')
    expect(getAccessibilityEmail()).toBe('info@hausofestate.com')
  })
})

describe('accessibility statement', () => {
  const html = renderToStaticMarkup(createElement(AccessibilityPage))

  it('says what the site aims for without claiming an audit it has not had', () => {
    expect(html).toContain('Accessibility statement')
    expect(html).toContain('We have not yet completed a full independent accessibility audit')
    expect(html).toContain('we cannot say the site fully meets WCAG 2.2 AA')
    expect(html).not.toMatch(/is fully (accessible|compliant)|fully conforms|is compliant with|has been audited/i)
  })

  it('gives a way to report a barrier and promises no response time', () => {
    expect(html).toContain('href="mailto:info@hausofestate.com"')
    expect(html).toContain('We will reply as soon as we can')
    expect(html).not.toMatch(/within \d+ (working )?(hours|days)/i)
  })
})

describe('breadcrumb structured data', () => {
  it('numbers the trail in order with absolute addresses', () => {
    expect(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Properties', path: '/properties' }]).itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://hausofestate.com/' },
      { '@type': 'ListItem', position: 2, name: 'Properties', item: 'https://hausofestate.com/properties' },
    ])
  })

  it('cannot be closed early by content', () => {
    expect(serializeJsonLd({ name: '</script><script>alert(1)</script>' })).not.toContain('<')
  })
})
