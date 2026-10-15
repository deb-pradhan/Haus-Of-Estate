// Match the current asset, so replacement artwork returns to centred framing.
const TOP_ALIGNED_ASSETS = new Set([
  '2b6588fc2082791b334c039e7bb914ba868a0cd7-821x957.png',
  '78f02b77572f0bcc951bae2cf1aaca2c5d2063ad-1379x920.jpg',
  '6c4d237acf5058d075f1f3a18dcdb1c09ac2818f-1535x1024.png',
  'a8caf01228f38bac61bc222fff7541a928aaaae4-1536x1024.png',
  '36f7ad14737705ada177cf24cf20a66bb42a20f0-5422x3615.jpg',
])

export function blogThumbnailPosition(imageUrl: string): 'center top' | 'center' {
  try {
    const url = new URL(imageUrl)
    const asset = url.pathname.split('/').at(-1) ?? ''
    if (url.hostname === 'cdn.sanity.io' && TOP_ALIGNED_ASSETS.has(asset)) {
      return 'center top'
    }
  } catch {
    // Local and fallback images retain normal centred framing.
  }
  return 'center'
}
