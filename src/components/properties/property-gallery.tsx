'use client'

import Image from 'next/image'
import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface GalleryImage {
  src: string
  full: string
  thumb: string
  alt: string
  /** Visible caption (concept / AI imagery must always carry one). */
  caption?: string
  concept: boolean
}

const NAV_BUTTON =
  'glass absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-estate-900 shadow-e2 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-estate-700/70 disabled:pointer-events-none disabled:opacity-0 sm:flex'

/**
 * Gallery: a native scroll-snap carousel (swipe on touch, works without JS
 * for the first image), arrow-key navigation, thumbnails and a full-screen
 * viewer. Every slide reserves its aspect ratio, so nothing shifts on load.
 * Only the first image is preloaded; the rest are lazy.
 */
export function PropertyGallery({
  images,
  title,
}: {
  images: GalleryImage[]
  title: string
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const frame = useRef<number | null>(null)
  const total = images.length

  const scrollToIndex = useCallback(
    (next: number) => {
      const el = scroller.current
      if (!el) return
      const clamped = Math.max(0, Math.min(total - 1, next))
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollTo({ left: clamped * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
      setIndex(clamped)
    },
    [total],
  )

  function onScroll() {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      const el = scroller.current
      if (!el || el.clientWidth === 0) return
      setIndex(Math.round(el.scrollLeft / el.clientWidth))
    })
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') scrollToIndex(index + 1)
    else if (event.key === 'ArrowLeft') scrollToIndex(index - 1)
    else if (event.key === 'Home') scrollToIndex(0)
    else if (event.key === 'End') scrollToIndex(total - 1)
    else return
    event.preventDefault()
  }

  if (total === 0) return null
  const current = images[index] ?? images[0]

  return (
    <section aria-label={`Photos of ${title}`}>
      <div className="relative overflow-hidden rounded-[20px] bg-estate-900 shadow-e2 md:rounded-[28px]">
        <div
          ref={scroller}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${title} photos. Use the left and right arrow keys to browse.`}
          tabIndex={0}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-gold-400 [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={img.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}`}
              className="relative aspect-[4/3] w-full shrink-0 snap-center md:aspect-[16/10]"
            >
              <button
                type="button"
                onClick={() => setLightbox(i)}
                aria-label={`View photo ${i + 1} of ${total} full screen`}
                className="group absolute inset-0 block cursor-zoom-in focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-gold-400"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 1023px) 100vw, 760px"
                  preload={i === 0}
                  className={img.concept ? 'object-contain' : 'object-cover'}
                />
              </button>
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToIndex(index - 1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className={cn(NAV_BUTTON, 'left-3')}
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(index + 1)}
              disabled={index === total - 1}
              aria-label="Next photo"
              className={cn(NAV_BUTTON, 'right-3')}
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-estate-900/75 px-3 py-1.5 text-xs font-medium text-white tabular-nums backdrop-blur">
          <Maximize2 aria-hidden="true" className="h-3.5 w-3.5" />
          {index + 1} / {total}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Photo {index + 1} of {total}
      </p>

      {current?.caption && (
        <p className="mt-3 px-1 text-sm leading-relaxed text-muted-foreground">
          {current.caption}
        </p>
      )}

      {total > 1 && (
        <ul
          aria-label="Photo thumbnails"
          className="mt-3 hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] md:flex"
        >
          {images.map((img, i) => (
            <li key={img.thumb} className="shrink-0">
              <button
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Show photo ${i + 1} of ${total}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'relative block h-16 w-24 overflow-hidden rounded-xl bg-estate-900 transition-[box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-estate-700/70',
                  i === index
                    ? 'ring-2 ring-estate-700 ring-offset-2 ring-offset-background'
                    : 'opacity-70 hover:opacity-100',
                )}
              >
                <Image
                  src={img.thumb}
                  alt=""
                  fill
                  sizes="96px"
                  className={img.concept ? 'object-contain' : 'object-cover'}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        images={images}
        title={title}
        index={lightbox}
        onIndexChange={setLightbox}
        onClosed={(last) => {
          scrollToIndex(last)
        }}
      />
    </section>
  )
}

function Lightbox({
  images,
  title,
  index,
  onIndexChange,
  onClosed,
}: {
  images: GalleryImage[]
  title: string
  index: number | null
  onIndexChange: (index: number | null) => void
  onClosed: (lastIndex: number) => void
}) {
  const total = images.length
  const open = index !== null
  const safe = index ?? 0
  const img = images[safe]

  function step(delta: number) {
    onIndexChange((safe + delta + total) % total)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClosed(safe)
          onIndexChange(null)
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') step(1)
          else if (event.key === 'ArrowLeft') step(-1)
        }}
        className="flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-estate-900/95 p-0 text-white sm:max-w-none left-0 top-0"
      >
        <DialogTitle className="sr-only">{title} photos</DialogTitle>
        <DialogDescription className="sr-only">
          Photo {safe + 1} of {total}. Use the left and right arrow keys to browse and
          Escape to close.
        </DialogDescription>

        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <p className="text-sm font-medium tabular-nums text-white/90">
            {safe + 1} / {total}
          </p>
          <DialogClose
            aria-label="Close photo viewer"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold-400"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </DialogClose>
        </div>

        <div className="relative min-h-0 flex-1">
          {img && (
            <Image
              key={img.full}
              src={img.full}
              alt={img.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          )}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold-400"
              >
                <ChevronLeft aria-hidden="true" className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gold-400"
              >
                <ChevronRight aria-hidden="true" className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        <div className="min-h-14 px-4 py-3 text-center text-sm leading-relaxed text-white/85 md:px-6">
          {img?.caption}
        </div>
      </DialogContent>
    </Dialog>
  )
}
