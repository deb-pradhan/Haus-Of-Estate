'use client'

import { useState } from 'react'
import Image from 'next/image'
import { showcaseImageBadge, showcaseImageBadgePosition } from '@/lib/showcase/captions'
import type { ShowcaseImage } from '@/lib/showcase/fixture'
import { cn } from '@/lib/utils'
import { ImageBadge } from './primitives'

/**
 * One large view with a visible "1 of N" count and a thumbnail for every image,
 * so nothing in a set is hidden. Renders and concepts are labelled in the frame.
 */
export function ImageViews({ images, label, sizes = '(min-width: 1024px) 760px, 100vw', aspect = 'aspect-[5/3]', preload = false, fit = 'cover' }: {
  images: ShowcaseImage[]
  /** Names the set for assistive technology, e.g. "Design views". */
  label: string
  sizes?: string
  aspect?: string
  preload?: boolean
  fit?: 'cover' | 'contain'
}) {
  const [index, setIndex] = useState(0)
  const selected = images[index] ?? images[0]
  if (!selected) return null
  const badge = showcaseImageBadge(selected)
  return (
    <figure className="min-w-0">
      <div className={cn('relative overflow-hidden rounded-2xl bg-estate-700/5', aspect)}>
        <Image src={selected.src} alt={selected.alt} fill unoptimized preload={preload && index === 0} sizes={sizes}
          className={fit === 'contain' ? 'object-contain' : 'object-cover'} />
        {badge && <ImageBadge position={showcaseImageBadgePosition(selected)}>{badge}</ImageBadge>}
        {images.length > 1 && (
          <span data-image-count className="pointer-events-none absolute right-2.5 top-2.5 z-10 rounded-md bg-estate-700/85 px-2.5 py-1 text-[11px] font-semibold leading-4 tabular-nums text-white">
            <span className="sr-only">Image </span>{index + 1} of {images.length}
          </span>
        )}
      </div>
      <figcaption className="mt-2 text-xs leading-5 text-muted-foreground">{selected.label ?? selected.alt}</figcaption>
      {images.length > 1 && (
        <div className="sc-scroll-x mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={label}>
          {images.map((image, viewIndex) => (
            <button key={image.src} type="button" aria-pressed={index === viewIndex}
              aria-label={`Show image ${viewIndex + 1} of ${images.length}: ${image.label ?? image.alt}`} onClick={() => setIndex(viewIndex)}
              className={cn('relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2', index === viewIndex ? 'border-estate-700' : 'border-transparent')}>
              <Image src={image.src} alt="" fill unoptimized sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </figure>
  )
}
