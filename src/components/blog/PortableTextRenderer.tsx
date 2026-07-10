'use client'

import { PortableText, PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { headingId } from '@/lib/reading-time'

interface PortableTextRendererProps {
  content: any[]
}

/** Flatten a block's spans to plain text for anchor ids. */
function blockText(value: any): string {
  return (value?.children || [])
    .map((c: any) => (typeof c?.text === 'string' ? c.text : ''))
    .join('')
    .trim()
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children, value }) => (
      <h2
        id={headingId(blockText(value))}
        className="scroll-mt-28 mt-14 mb-0 font-serif text-[1.85rem] md:text-[2.25rem] font-medium leading-[1.15] text-ink-900"
      >
        {children}
      </h2>
    ),
    h3: ({ children, value }) => (
      <h3
        id={headingId(blockText(value))}
        className="scroll-mt-28 mt-11 mb-0 font-serif text-2xl md:text-3xl font-medium leading-snug text-ink-900"
      >
        {children}
      </h3>
    ),
    h4: ({ children, value }) => (
      <h4
        id={headingId(blockText(value))}
        className="scroll-mt-28 mt-9 mb-0 font-sans text-lg font-semibold tracking-tight text-ink-900"
      >
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mt-6 text-[1.125rem] md:text-[1.1875rem] leading-[1.8] text-ink-900/90 [&:first-child]:mt-0">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-10 border-l-2 border-estate-700 pl-6 md:pl-8">
        <p className="font-serif text-2xl md:text-[1.75rem] italic leading-snug text-ink-900">
          {children}
        </p>
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <Link
        href={value?.href || '#'}
        target={value?.blank ? '_blank' : undefined}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="font-medium text-estate-700 underline decoration-estate-700/30 underline-offset-[3px] transition-colors hover:decoration-estate-700"
      >
        {children}
      </Link>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-ink-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[0.9em] text-ink-900">
        {children}
      </code>
    ),
    underline: ({ children }) => <u className="underline">{children}</u>,
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-6 space-y-3 pl-1.5">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-6 space-y-3 pl-1.5 [counter-reset:item]">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="relative pl-7 text-[1.125rem] md:text-[1.1875rem] leading-[1.8] text-ink-900/90 before:absolute before:left-1 before:top-[0.85em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-gold-500">
        {children}
      </li>
    ),
    number: ({ children }) => (
      <li className="relative pl-8 text-[1.125rem] md:text-[1.1875rem] leading-[1.8] text-ink-900/90 [counter-increment:item] before:absolute before:left-0 before:top-0 before:font-serif before:text-lg before:font-semibold before:text-estate-700 before:content-[counter(item)'.']">
        {children}
      </li>
    ),
  },
  types: {
    image: ({ value }) => {
      const url = value?.asset?.url
      if (!url) return null
      return (
        <figure className="my-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={url}
              alt={value.alt || 'Blog image'}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-3 text-center text-sm italic text-slate-700">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
}

export function PortableTextRenderer({ content }: PortableTextRendererProps) {
  return (
    <div className="blog-body">
      <PortableText value={content} components={components} />
    </div>
  )
}
