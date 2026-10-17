'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackAnalytics } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/**
 * Mobile-only bottom action bar: price, Enquire and WhatsApp. It steps aside
 * while the enquiry form or the site footer is on screen so it never covers
 * content or competes with the form.
 */
export function StickyCta({
  price,
  whatsappHref,
}: {
  price: string
  whatsappHref: string
}) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const candidates: (Element | null)[] = [
      document.getElementById('request-viewing'),
      document.querySelector('footer'),
    ]
    const targets = candidates.filter((el): el is Element => el !== null)
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visible = new Set<Element>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      }
      setHidden(visible.size > 0)
    })
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div
      inert={hidden}
      className={cn(
        'glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] shadow-e3 transition-transform duration-300 ease-out-expo md:hidden',
        hidden && 'translate-y-full',
      )}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
        <p className="min-w-0 flex-1">
          <span className="block truncate font-serif text-lg font-semibold leading-tight tabular-nums text-estate-900">
            {price}
          </span>
          {/\d/.test(price) && (
            <span className="block text-xs text-muted-foreground">Asking price</span>
          )}
        </p>
        <Button asChild size="default" className="shrink-0">
          <a href="#request-viewing">
            Enquire
            <ArrowRight aria-hidden="true" />
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          size="icon"
          className="shrink-0 bg-white/60"
        >
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp about this property"
            onClick={() => trackAnalytics('haus_contact_click', { contact_method: 'whatsapp' })}
          >
            <MessageCircle aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  )
}
