import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next-sanity/webhook', () => ({
  parseBody: vi.fn(),
}))

const mockedParseBody = vi.mocked(parseBody)
const mockedRevalidatePath = vi.mocked(revalidatePath)
const mockedRevalidateTag = vi.mocked(revalidateTag)
const request = {} as NextRequest

describe('Sanity revalidation webhook', () => {
  beforeEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = 'test-webhook-secret'
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.SANITY_REVALIDATE_SECRET
  })

  it('fails closed when the webhook secret is absent', async () => {
    delete process.env.SANITY_REVALIDATE_SECRET

    const response = await POST(request)

    expect(response.status).toBe(503)
    expect(mockedParseBody).not.toHaveBeenCalled()
  })

  it('rejects an invalid signature without revalidating anything', async () => {
    mockedParseBody.mockResolvedValue({
      body: { _type: 'property', slug: 'home' },
      isValidSignature: false,
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(mockedRevalidatePath).not.toHaveBeenCalled()
    expect(mockedRevalidateTag).not.toHaveBeenCalled()
  })

  it('rejects unsupported documents after signature verification', async () => {
    mockedParseBody.mockResolvedValue({
      body: { _type: 'privateNote', slug: 'do-not-publish' },
      isValidSignature: true,
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(mockedRevalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates only mapped paths and tags for a valid document', async () => {
    mockedParseBody.mockResolvedValue({
      body: {
        _id: 'property-1',
        _type: 'property',
        slug: 'new-home',
        previousSlug: 'old-home',
      },
      isValidSignature: true,
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/properties/new-home')
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/properties/old-home')
    expect(mockedRevalidatePath).not.toHaveBeenCalledWith('/api/revalidate')
    expect(mockedRevalidateTag).toHaveBeenCalledWith('sanity:property', 'max')
  })
})
