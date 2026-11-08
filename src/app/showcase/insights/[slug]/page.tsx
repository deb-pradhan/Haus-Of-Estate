import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalendarDays, Clock, ImageOff } from 'lucide-react'
import { PortableTextRenderer } from '@/components/blog/PortableTextRenderer'
import { LaunchInterestCta, LaunchInterestSection } from '@/components/blog/LaunchInterestSection'
import { LaunchRegisterSimulated } from '@/components/showcase/launch-register'
import { Breadcrumbs, Notice } from '@/components/showcase/primitives'
import { COMPANY_IDENTITY } from '@/lib/company-identity'
import { readingTimeFromBlocks } from '@/lib/reading-time'
import { showcasePath } from '@/lib/showcase/access'
import { findShowcaseArticle } from '@/lib/showcase/articles'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = findShowcaseArticle((await params).slug)
  return { title: article ? `${article.title} (draft preview)` : 'Article not found' }
}

export default async function ShowcaseArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = findShowcaseArticle((await params).slug)
  if (!article) notFound()
  const livePath = `/blog/${article.slug}`
  const readMins = readingTimeFromBlocks(article.body)

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:px-6">
      <Breadcrumbs items={[{ label: 'Overview', href: showcasePath() }, { label: 'Insights' }, { label: article.title }]} />

      <Notice className="mt-3">
        <strong className="font-semibold">Draft article preview.</strong> Rendered from the paste-ready draft, not from the CMS. It is not published; the live address would be <span className="font-medium">hausofestate.com{livePath}</span>. The register-interest form below is simulated.
      </Notice>

      <header className="mt-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase text-estate-700">{article.categorySlugs.map((slug) => slug.replace(/-/g, ' ')).join(' · ') || 'Insights'}</p>
        <h1 className="mt-3 font-serif text-[2.25rem] font-medium leading-[1.1] text-ink-900 md:text-[3rem] md:leading-[1.05]">{article.title}</h1>
        {article.subtitle && <p className="mt-4 text-lg leading-relaxed text-slate-700 md:text-xl">{article.subtitle}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-700">
          <span className="font-medium text-ink-900">By {COMPANY_IDENTITY.name}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-mist-400" aria-hidden />{readMins} min read</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-mist-400" aria-hidden />Draft prepared {article.preparedOn} · not published</span>
        </div>
        {article.launch && <LaunchInterestCta launch={article.launch} />}
      </header>

      {/* Placeholder in the hero's position: no approved project image was supplied. */}
      <figure className="mt-8" aria-label="Featured image placeholder">
        <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-estate-700/25 bg-[repeating-linear-gradient(135deg,transparent,transparent_14px,rgba(23,74,58,0.05)_14px,rgba(23,74,58,0.05)_28px)] px-6 text-center md:rounded-3xl">
          <ImageOff aria-hidden className="size-8 text-estate-700/60" />
          <p className="font-serif text-xl font-medium text-estate-700 md:text-2xl">Approved project image pending</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">Placeholder for layout only. No Palm Springs image or brochure has been approved. Renders from other projects are not reused here.</p>
        </div>
        <figcaption className="mt-2 text-xs leading-5 text-muted-foreground">The published article will show no hero until an approved image with alt text is added in Studio.</figcaption>
      </figure>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="min-w-0 lg:col-span-8">
          <PortableTextRenderer content={article.body} />
          {article.launch && (
            <LaunchInterestSection
              launch={article.launch}
              intakeReady={false}
              form={<LaunchRegisterSimulated launch={article.launch} livePath={livePath} />}
            />
          )}
        </div>

        <aside className="lg:col-span-4" aria-labelledby="review-notes-title">
          <div className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-24">
            <h2 id="review-notes-title" className="font-serif text-xl font-medium text-estate-700">Editorial review notes</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">URL slug</dt><dd className="mt-0.5 break-all font-mono text-[13px] text-estate-700">/blog/{article.slug}</dd></div>
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">SEO title</dt><dd className="mt-0.5 text-estate-700">{article.seo.seoTitle ?? '—'}</dd></div>
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Meta description</dt><dd className="mt-0.5 text-estate-700">{article.seo.seoDesc ?? '—'}</dd></div>
              {article.editorialGuidance?.primaryKeyword && (
                <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Keyword guidance</dt><dd className="mt-0.5 text-estate-700">{[article.editorialGuidance.primaryKeyword, ...(article.editorialGuidance.secondaryKeywords ?? [])].join(' · ')}</dd></div>
              )}
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Source</dt><dd className="mt-0.5 text-estate-700">{article.source}</dd></div>
            </dl>
            {article.reviewFlags.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-estate-700">Before publishing</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/85">
                  {article.reviewFlags.map((flag) => <li key={flag}>{flag}</li>)}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
