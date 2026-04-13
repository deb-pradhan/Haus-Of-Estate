import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const secret = req.headers.get('x-sanity-webhook-secret')

    if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
      return new Response('Invalid secret', { status: 401 })
    }

    const path = body?.path

    if (!path) {
      return new Response('Missing path', { status: 400 })
    }

    revalidatePath(path)

    return NextResponse.json({ revalidated: true, path })
  } catch (error) {
    console.error('Revalidation error:', error)
    return new Response('Internal error', { status: 500 })
  }
}