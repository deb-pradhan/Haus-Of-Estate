'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { isConceptMedia, propertyMediaCaption, type PropertyMediaImage } from '@/lib/property-media'
import { PropertyMediaBadge } from './property-media-badge'
import { PropertyPhotoBranding } from './property-photo-branding'

/**
 * Every image stays on the page with its caption, so nothing is hidden behind
 * a slider. The heading states how many there are, each one opens a full-size
 * viewer with arrow-key browsing, and concept boards are never cropped.
 */
export function PropertyGallery({ images, title, heading, showHausLogo = false, unoptimized = false }: {
  images: PropertyMediaImage[]
  title: string
  heading: string
  showHausLogo?: boolean
  unoptimized?: boolean
}) {
  const [open, setOpen] = useState<number | null>(null)
  // Closing the viewer returns keyboard focus to the image that opened it.
  const opener = useRef<HTMLButtonElement | null>(null)
  const total = images.length
  if (total === 0) return null
  const current = open === null ? undefined : images[open]
  const step = (delta: number) => setOpen((index) => index === null ? index : (index + delta + total) % total)

  return (
    <section id="gallery" className="mt-10 scroll-mt-24" aria-labelledby="property-gallery-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="property-gallery-heading" className="font-serif text-xl font-medium text-estate-700">{heading}</h2>
        <p data-image-count className="text-sm text-muted-foreground">{total} {total === 1 ? 'image' : 'images'}</p>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {images.map((img, i) => {
          const caption = propertyMediaCaption(img)
          return (
            <li key={`${img.src}-${i}`}>
              <figure className="overflow-hidden rounded-xl border border-border bg-surface">
                <button type="button" onClick={(event) => { opener.current = event.currentTarget; setOpen(i) }} aria-label={`View image ${i + 1} of ${total} full size: ${img.alt}`}
                  className="group relative block aspect-[4/3] w-full cursor-zoom-in bg-estate-700/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-estate-700">
                  <Image src={img.src} alt={img.alt} fill sizes="(max-width: 640px) 100vw, 50vw" unoptimized={unoptimized}
                    className={isConceptMedia(img) ? 'object-contain' : 'object-cover'} />
                  <PropertyMediaBadge image={img} />
                  <PropertyPhotoBranding enabled={showHausLogo} />
                  <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-estate-700/85 px-2 py-1 text-[11px] font-semibold tabular-nums text-white">
                    <Maximize2 className="h-3 w-3" /> {i + 1} of {total}
                  </span>
                </button>
                {caption && <figcaption className="px-3 py-3 text-sm leading-relaxed text-estate-700">{caption}</figcaption>}
              </figure>
            </li>
          )
        })}
      </ul>

      <Dialog open={open !== null} onOpenChange={(next) => { if (!next) setOpen(null) }}>
        <DialogContent showCloseButton={false}
          onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus() }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') step(1)
            else if (event.key === 'ArrowLeft') step(-1)
          }}
          className="left-0 top-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-ink-900 p-0 text-white sm:max-w-none">
          <DialogTitle className="sr-only">{title}: images</DialogTitle>
          <DialogDescription className="sr-only">
            Image {(open ?? 0) + 1} of {total}. Use the left and right arrow keys to browse and Escape to close.
          </DialogDescription>
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <p className="text-sm font-medium tabular-nums text-white/90" aria-live="polite">{(open ?? 0) + 1} of {total}</p>
            <DialogClose aria-label="Close image viewer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none">
              <X aria-hidden="true" className="h-5 w-5" />
            </DialogClose>
          </div>
          <div className="relative min-h-0 flex-1">
            {current && <Image key={current.src} src={current.full ?? current.src} alt={current.alt} fill sizes="100vw" unoptimized={unoptimized} className="object-contain" />}
            {current && <PropertyMediaBadge image={current} />}
            {total > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Previous image"
                  className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next image"
                  className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <ChevronRight aria-hidden="true" className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          <p className="min-h-14 px-4 py-3 text-center text-sm leading-relaxed text-white/85 md:px-6">{current ? propertyMediaCaption(current) ?? current.alt : null}</p>
        </DialogContent>
      </Dialog>
    </section>
  )
}
