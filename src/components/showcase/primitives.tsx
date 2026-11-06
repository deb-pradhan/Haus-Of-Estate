import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ExternalLink, Info } from 'lucide-react'
import type { ShowcaseImage, ShowcaseTextBlock } from '@/lib/showcase/fixture'
import { cn } from '@/lib/utils'

/** Fixture images are existing CDN derivatives, so they render without the optimizer. */
export function FixtureImage({ image, sizes, className, fit = 'cover', preload = false }: {
  image: ShowcaseImage
  sizes: string
  className?: string
  fit?: 'cover' | 'contain'
  preload?: boolean
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      unoptimized
      preload={preload}
      sizes={sizes}
      className={cn(fit === 'contain' ? 'object-contain' : 'object-cover', className)}
    />
  )
}

export function Notice({ children, className, icon = true }: { children: React.ReactNode; className?: string; icon?: boolean }) {
  return (
    <p role="note" className={cn('flex gap-2.5 rounded-xl border border-gold-500/35 bg-gold-500/10 px-3.5 py-3 text-sm leading-6 text-estate-700', className)}>
      {icon && <Info aria-hidden className="mt-1 size-4 shrink-0 text-gold-500" />}
      <span>{children}</span>
    </p>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
            {index > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground/60" />}
            {item.href ? (
              <Link href={item.href} className="inline-flex min-h-11 items-center rounded-md px-1 hover:text-estate-700 hover:underline">{item.label}</Link>
            ) : (
              <span aria-current="page" className="inline-flex min-h-11 items-center truncate px-1 font-medium text-estate-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function TextBlocks({ blocks, className }: { blocks: ShowcaseTextBlock[]; className?: string }) {
  if (!blocks.length) return null
  return (
    <div className={cn('space-y-4 text-base leading-7 text-foreground/85', className)}>
      {blocks.map((block) => {
        const content = block.spans.map((span) => span.strong
          ? <strong key={span.key} className="font-semibold text-estate-700">{span.text}</strong>
          : <span key={span.key}>{span.text}</span>)
        if (block.style === 'h2') return <h2 key={block.key} className="sc-heading pt-2 text-estate-700">{content}</h2>
        if (block.style === 'h3') return <h3 key={block.key} className="font-serif text-xl font-medium text-estate-700">{content}</h3>
        return <p key={block.key}>{content}</p>
      })}
    </div>
  )
}

export function FactGrid({ items, className }: { items: { label: string; value: React.ReactNode; note?: string }[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {items.map((item) => (
        <div key={item.label} className="border-b border-border py-3.5 pr-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-base font-medium leading-6 text-estate-700">{item.value}</dd>
          {item.note && <dd className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</dd>}
        </div>
      ))}
    </dl>
  )
}

/** An uncropped plan on paper, with its label and a link to the full-size file. */
export function PlanFigure({ plan, headingLevel: Heading = 'h4' }: { plan: ShowcaseImage; headingLevel?: 'h3' | 'h4' }) {
  const width = plan.width ?? 1600
  const height = plan.height ?? 1131
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="sc-plan p-3 sm:p-5">
        <Image src={plan.src} alt={plan.alt} width={width} height={height} unoptimized sizes="(min-width: 1024px) 720px, 100vw" className="mx-auto h-auto w-full max-h-[80vh] object-contain" />
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-4 py-3">
        <Heading className="text-sm font-semibold text-estate-700">{plan.label ?? plan.alt}</Heading>
        <a href={plan.src} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-estate-700 underline underline-offset-4">
          Open full size <ExternalLink aria-hidden className="size-3.5" />
          <span className="sr-only">: {plan.label ?? plan.alt} (opens in a new tab)</span>
        </a>
        {plan.caption && <p className="basis-full text-sm leading-6 text-muted-foreground">{plan.caption}</p>}
      </figcaption>
    </figure>
  )
}

export function SectionHeading({ eyebrow, title, intro, id, className }: {
  eyebrow?: string
  title: string
  intro?: React.ReactNode
  id?: string
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow && <p className="sc-eyebrow">{eyebrow}</p>}
      <h2 id={id} className="sc-heading mt-2 text-estate-700">{title}</h2>
      {intro && <p className="mt-3 text-base leading-7 text-muted-foreground">{intro}</p>}
    </div>
  )
}
