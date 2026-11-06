import { createElement, type PropsWithChildren } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ pathname: '/careers' }))
vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }))
vi.mock('next/image', () => ({ default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }) }))
vi.mock('@/components/lead-modal', () => ({ useLeadModals: () => ({ openAccount: vi.fn(), openBuyer: vi.fn(), openSeller: vi.fn() }) }))
vi.mock('@/components/lead-modal/modal-context', () => ({ useLeadModals: () => ({ openBuyer: vi.fn(), openSeller: vi.fn() }) }))
vi.mock('@/components/lead-eoi/lead-eoi-controller', () => ({ useLeadEoi: () => ({ enabled: false }) }))
vi.mock('@/components/auth/header-auth-control', () => ({ HeaderAuthControl: () => null }))
vi.mock('@/components/currency/currency-selector', () => ({ CurrencySelector: () => null }))
vi.mock('@/components/layout/property-navigation', () => ({ PropertiesCountryMenu: () => null, MobilePropertyMarkets: () => null, NavbarPropertySearch: () => null }))
vi.mock('@/components/social/social-profile-links', () => ({ SocialProfileLinks: () => null }))
vi.mock('@/components/analytics/consent-manager', () => ({ CookieSettingsButton: () => null }))
// Render the mobile sheet's contents too so closed portals cannot hide a stale contact.
vi.mock('@/components/ui/sheet', () => {
  const Element = ({ children }: PropsWithChildren) => createElement('div', null, children)
  return { Sheet: Element, SheetContent: Element, SheetTrigger: Element, SheetTitle: Element, SheetDescription: Element }
})

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

describe('careers contact surfaces', () => {
  it.each(['/careers', '/careers/content-writer'])('shows only the careers inbox on %s, including mobile navigation', (pathname) => {
    mocks.pathname = pathname
    for (const component of [createElement(Header), createElement(Footer, { careersEmail: 'careers@hausofestate.com' })]) {
      const html = renderToStaticMarkup(component)
      expect(html).toContain('mailto:careers@hausofestate.com')
      expect(html).not.toMatch(/mailto:info@|tel:|wa\.me|7721/)
    }
  })

  it('retains company telephone, WhatsApp and general email elsewhere', () => {
    mocks.pathname = '/properties'
    for (const component of [createElement(Header), createElement(Footer, { careersEmail: 'careers@hausofestate.com' })]) {
      const html = renderToStaticMarkup(component)
      expect(html).toContain('mailto:info@hausofestate.com')
      expect(html).toContain('tel:+447496033321')
      expect(html).toContain('https://wa.me/971585607033')
    }
  })
})
