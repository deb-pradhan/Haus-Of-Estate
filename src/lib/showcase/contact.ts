/** Client-safe contact helpers for the showcase. Nothing here sends anything. */

export const SHOWCASE_SALES_EMAIL = 'sales@hausofestate.com'

/** A link that opens the reader's own email app with the subject filled in. */
export function showcaseMailto(subject: string): string {
  return `mailto:${SHOWCASE_SALES_EMAIL}?subject=${encodeURIComponent(subject)}`
}
