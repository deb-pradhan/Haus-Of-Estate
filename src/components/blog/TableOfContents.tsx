'use client'

import { useState, useEffect } from 'react'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: any[]
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const extractedHeadings: Heading[] = []

    function extractHeadings(nodes: any[]) {
      for (const node of nodes) {
        if (node._type === 'block' && ['h2', 'h3', 'h4'].includes(node.style)) {
          const text = node.children
            ?.map((child: any) => child.text || '')
            .join('')
            .trim()
          if (text) {
            const id = text
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
            extractedHeadings.push({
              id,
              text,
              level: parseInt(node.style.replace('h', '')),
            })
          }
        }
        if (node.children) {
          extractHeadings(node.children)
        }
      }
    }

    extractHeadings(content)
    setHeadings(extractedHeadings)
  }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav className="sticky top-24 hidden text-sm lg:block">
      <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-700">
        On this page
      </h4>
      <ul className="space-y-2 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id} style={{ paddingLeft: heading.level > 2 ? '1rem' : '0' }}>
            <a
              href={`#${heading.id}`}
              className={`block transition-colors ${
                heading.level > 2 ? 'text-xs' : 'text-sm'
              } ${
                activeId === heading.id
                  ? 'border-l-2 border-estate-700 pl-3 text-estate-700 font-medium'
                  : 'pl-3 text-slate-700 hover:text-estate-700'
              }`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}