'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackAnalytics } from '@/lib/analytics'

/** WhatsApp deep link carrying the listing title and URL in the message. */
export function WhatsAppButton({
  href,
  label = 'Message us on WhatsApp',
  className,
}: {
  href: string
  label?: string
  className?: string
}) {
  return (
    <Button asChild variant="outline" size="lg" className={className}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackAnalytics('haus_contact_click', { contact_method: 'whatsapp' })}
      >
        <MessageCircle aria-hidden="true" />
        {label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </Button>
  )
}
