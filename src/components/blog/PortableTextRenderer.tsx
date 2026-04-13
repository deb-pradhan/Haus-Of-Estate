'use client'

import { PortableText, PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'

interface PortableTextRendererProps {
  content: any[]
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-10 font-serif text-2xl md:text-3xl font-medium text-ink-900 leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 font-serif text-xl md:text-2xl font-medium text-ink-900 leading-snug">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 font-sans text-lg font-semibold text-ink-900">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mt-4 text-base md:text-lg leading-relaxed text-slate-700">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-4 border-gold-500 pl-6 italic">
        <p className="text-lg text-ink-900">{children}</p>
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <Link
        href={value?.href || '#'}
        target={value?.blank ? '_blank' : undefined}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="text-estate-700 underline underline-offset-2 hover:text-estate-600"
      >
        {children}
      </Link>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-ink-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-sm text-ink-900">
        {children}
      </code>
    ),
    underline: ({ children }) => <u className="underline">{children}</u>,
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 space-y-2 pl-6">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 space-y-2 pl-6 list-decimal">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="text-base text-slate-700 leading-relaxed">{children}</li>
    ),
    number: ({ children }) => (
      <li className="text-base text-slate-700 leading-relaxed">{children}</li>
    ),
  },
  types: {
    image: ({ value }) => {
      const url = value?.asset?.url
      if (!url) return null
      return (
        <figure className="my-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={url}
              alt={value.alt || 'Blog image'}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-slate-700 italic">
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
    <div className="prose prose-lg max-w-none">
      <PortableText value={content} components={components} />
    </div>
  )
}