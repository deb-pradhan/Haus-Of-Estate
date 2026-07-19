import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { sanityFetch } from '@/sanity'
import { FAQS_QUERY } from '@/sanity/queries'
import { FaqAccordion, type FaqItem } from '@/components/faq/faq-accordion'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

interface FaqDoc extends FaqItem {
  category?: string
  featured?: boolean
}

export const metadata: Metadata = {
  title: 'FAQs',
  description:
    'Plain-English answers to the questions buyers, renters, sellers and landlords ask us most often.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'FAQs — Haus of Estate',
    description:
      'Plain-English answers to the questions buyers, renters, sellers and landlords ask us most often.',
    url: '/faq',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

export const revalidate = 60

// Flatten Sanity Portable Text blocks into a plain-text string for JSON-LD.
function portableTextToPlainText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((block) => {
      if (
        block &&
        typeof block === 'object' &&
        'children' in block &&
        Array.isArray((block as { children?: unknown }).children)
      ) {
        return (block as { children: Array<{ text?: string }> }).children
          .map((child) => child?.text ?? '')
          .join('')
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

export default async function FaqPage() {
  const { data } = await sanityFetch<FaqDoc[]>({ query: FAQS_QUERY })
  const items = data ?? []

  const faqJsonLd =
    items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items
            .map((f) => ({
              question: f.question,
              answer: portableTextToPlainText(f.answer),
            }))
            .filter((f) => f.question && f.answer)
            .map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.answer,
              },
            })),
        }
      : null

  // Group by category, preserving GROQ order.
  const byCategory = new Map<string, FaqDoc[]>()
  for (const f of items) {
    const c = f.category || 'General'
    if (!byCategory.has(c)) byCategory.set(c, [])
    byCategory.get(c)!.push(f)
  }
  const categories = [...byCategory.entries()]

  return (
    <div className="min-h-screen">
      {faqJsonLd && faqJsonLd.mainEntity.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            FAQs
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] text-white md:text-5xl">
            Straight answers,{' '}
            <span className="text-gold-400">no jargon.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            The questions buyers, renters, sellers and landlords ask us most often.
            If yours isn&apos;t here, ask us directly — we&apos;ll reply within
            two working hours.
          </p>
        </div>
      </section>

      <section className="bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <h2 className="font-serif text-xl font-medium text-estate-700">
                FAQs are on their way.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                We&apos;re finalising our FAQ library. In the meantime, please
                send your question via the contact form.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {categories.map(([cat, list]) => (
                <div key={cat}>
                  <h2 className="mb-4 font-serif text-sm font-semibold uppercase tracking-[0.2em] text-gold-500">
                    {cat}
                  </h2>
                  <FaqAccordion items={list} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-border bg-surface p-6 text-center shadow-sm md:p-8">
            <h2 className="font-serif text-xl font-medium text-estate-700 md:text-2xl">
              Still have a question?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Send a quick enquiry — a member of our team will get back to you
              within two working hours.
            </p>
            <Link
              href="/#services"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-estate-600"
            >
              Speak to us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
