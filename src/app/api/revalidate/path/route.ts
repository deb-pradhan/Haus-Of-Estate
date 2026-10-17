import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, enforceRateLimit } from '@/lib/rate-limit'
import { safeEqual } from '@/lib/security'

const MIN_SECRET_LENGTH = 16
const MAX_PATH_LENGTH = 200

// Sanity webhooks come from a handful of IPs; this mainly slows secret guessing.
const limiter = createRateLimiter({ id: 'revalidate', limit: 60, windowMs: 60_000 })

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, limiter)
  if (limited) return limited

  // Fail closed: an unset/short secret must never allow `"" === ""` to pass.
  const expected = process.env.SANITY_REVALIDATE_SECRET ?? ''
  if (expected.length < MIN_SECRET_LENGTH) {
    console.error('[revalidate] SANITY_REVALIDATE_SECRET is missing or too short')
    return new Response('Revalidation is not configured', { status: 503 })
  }

  const provided = req.headers.get('x-sanity-webhook-secret') ?? ''
  if (!safeEqual(provided, expected)) {
    return new Response('Invalid secret', { status: 401 })
  }

  let body: { path?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const path = body?.path
  if (typeof path !== 'string' || path.length === 0) {
    return new Response('Missing path', { status: 400 })
  }
  // Site-relative paths only, no query/fragment, no traversal, bounded length.
  if (
    path.length > MAX_PATH_LENGTH ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[?#\\]|\.\.|[\u0000-\u001F]/.test(path)
  ) {
    return new Response('Invalid path', { status: 400 })
  }

  try {
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, path })
  } catch {
    console.error('[revalidate] revalidatePath failed')
    return new Response('Internal error', { status: 500 })
  }
}
