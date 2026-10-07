import { loadPropertyPreviewMedia } from '@/lib/property-previews'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const previewHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
}

function notFound() {
  return new Response(null, { status: 404, headers: previewHeaders })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (process.env.NODE_ENV !== 'development') return notFound()
  const { filename } = await params
  const bytes = await loadPropertyPreviewMedia(filename)
  if (!bytes) return notFound()
  return new Response(bytes as BodyInit, {
    headers: {
      ...previewHeaders,
      'Content-Type': 'image/jpeg',
      'Content-Length': String(bytes.byteLength),
    },
  })
}
