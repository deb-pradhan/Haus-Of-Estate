import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

import {
  getSanityRevalidationTargets,
  type SanityWebhookDocument,
} from '@/sanity/revalidation'

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim()

  if (!secret) {
    return NextResponse.json(
      { error: 'Revalidation is not configured' },
      { status: 503 },
    )
  }

  let parsedBody: Awaited<ReturnType<typeof parseBody<SanityWebhookDocument>>>

  try {
    parsedBody = await parseBody<SanityWebhookDocument>(req, secret, true)
  } catch {
    return NextResponse.json({ error: 'Malformed webhook' }, { status: 400 })
  }

  if (parsedBody.isValidSignature !== true) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  const targets = getSanityRevalidationTargets(parsedBody.body)

  if (!targets) {
    return NextResponse.json(
      { error: 'Unsupported webhook document' },
      { status: 400 },
    )
  }

  try {
    for (const target of targets.paths) {
      if (target.type) {
        revalidatePath(target.path, target.type)
      } else {
        revalidatePath(target.path)
      }
    }

    for (const tag of targets.tags) {
      revalidateTag(tag, 'max')
    }
  } catch {
    console.error('Sanity revalidation failed')
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }

  return NextResponse.json({
    revalidated: true,
    documentType: targets.documentType,
    pathCount: targets.paths.length,
    tagCount: targets.tags.length,
  })
}
