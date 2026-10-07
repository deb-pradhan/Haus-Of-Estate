import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MainLayout from './layout'

vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: false }) }))
vi.mock('@/components/layout/header', () => ({ Header: () => null }))
vi.mock('@/components/layout/footer', () => ({ Footer: () => null }))
vi.mock('@/lib/careers-settings', () => ({ getCareersInbox: () => 'test@example.test' }))
vi.mock('@/lib/features', () => ({ isAuthEnabled: () => false, isPropertyAssistantEnabled: () => true }))
vi.mock('@/lib/lead-intake/security', () => ({ isLeadIntakeReady: () => true }))
vi.mock('@/components/lead-modal', () => ({
  LeadModalProvider: ({ children, leadIntakeEnabled }: { children: React.ReactNode; leadIntakeEnabled: boolean }) =>
    <div data-intake-enabled={String(leadIntakeEnabled)}>{children}</div>,
}))
vi.mock('@/components/property-assistant/property-assistant-provider', () => ({
  PropertyAssistantProvider: ({ children }: { children: React.ReactNode }) => <div data-assistant>{children}</div>,
}))
vi.mock('@/sanity/live', () => ({
  isSanityLivePreviewConfigured: true,
  SanityLive: () => <div data-sanity-live />,
}))

afterEach(() => vi.unstubAllEnvs())

describe('local catalogue preview shell', () => {
  it('disables intake, assistant and live subscriptions even if their services are configured', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', 'true')
    const html = renderToStaticMarkup(await MainLayout({ children: <p>Catalogue</p> }))
    expect(html).toContain('data-intake-enabled="false"')
    expect(html).toContain('Catalogue')
    expect(html).not.toContain('data-assistant')
    expect(html).not.toContain('data-sanity-live')
  })

  it.each(['production', 'development'])('preserves the ordinary %s shell outside the local preview', async (mode) => {
    vi.stubEnv('NODE_ENV', mode)
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', mode === 'production' ? 'true' : 'false')
    const html = renderToStaticMarkup(await MainLayout({ children: <p>Catalogue</p> }))
    expect(html).toContain('data-intake-enabled="true"')
    expect(html).toContain('data-assistant')
    expect(html).toContain('data-sanity-live')
  })
})
