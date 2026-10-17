'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackAnalytics } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/**
 * The whole property card is one link. Click analytics carry only the public
 * content path (never search text or personal data).
 */
export function TrackedCardLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(className)}
      onClick={() => trackAnalytics('haus_property_click', { content_path: href })}
    >
      {children}
    </Link>
  )
}
