import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  withConfig: vi.fn(),
  defineEnableDraftMode: vi.fn(),
  handlePreview: vi.fn(),
}))

vi.mock('@/sanity', () => ({ client: { withConfig: mocks.withConfig } }))
vi.mock('next-sanity/draft-mode', () => ({
  defineEnableDraftMode: mocks.defineEnableDraftMode,
}))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('SANITY_API_READ_TOKEN', '')
  vi.stubEnv('SANITY_API_BROWSER_TOKEN', '')
  mocks.withConfig.mockReturnValue({ previewClient: true })
  mocks.defineEnableDraftMode.mockReturnValue({ GET: mocks.handlePreview })
})

afterEach(() => vi.unstubAllEnvs())

describe('authenticated Sanity preview entry', () => {
  it('keeps preview unavailable without a server credential', async () => {
    vi.stubEnv('SANITY_API_BROWSER_TOKEN', 'test-browser-token')
    const { GET } = await import('./route')
    const response = await GET(new Request('https://test.example/api/draft-mode/enable'))
    expect(response.status).toBe(503)
    expect(mocks.defineEnableDraftMode).not.toHaveBeenCalled()
    expect(mocks.handlePreview).not.toHaveBeenCalled()
  })

  it('supports server-only preview while retaining Sanity secret validation', async () => {
    vi.stubEnv('SANITY_API_READ_TOKEN', 'test-server-token')
    const rejected = new Response('Invalid secret', { status: 401 })
    mocks.handlePreview.mockResolvedValue(rejected)
    const { GET } = await import('./route')
    const request = new Request('https://test.example/api/draft-mode/enable')
    expect(await GET(request)).toBe(rejected)
    expect(mocks.withConfig).toHaveBeenCalledWith({ token: 'test-server-token' })
    expect(mocks.defineEnableDraftMode).toHaveBeenCalledWith({
      client: { previewClient: true },
    })
    expect(mocks.handlePreview).toHaveBeenCalledWith(request)
  })
})
