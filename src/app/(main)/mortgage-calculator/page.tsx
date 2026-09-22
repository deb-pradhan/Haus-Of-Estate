import type { Metadata } from 'next'
import { MortgageCalculator } from '@/components/tools/mortgage-calculator'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Mortgage repayment calculator',
  description: 'Estimate monthly mortgage repayments and total interest using your own loan amount, interest rate and term.',
  alternates: { canonical: '/mortgage-calculator' },
  openGraph: {
    title: 'Mortgage repayment calculator — Haus of Estate',
    description: 'Explore an illustrative monthly repayment using your own figures.',
    url: '/mortgage-calculator',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

export default function MortgageCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-estate-700 px-4 py-16 text-white md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Planning your purchase</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-medium leading-tight md:text-5xl">Mortgage repayment calculator</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">Explore your estimated monthly repayment, sometimes called an EMI, and the total interest over your chosen term. Start with your own figures.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <MortgageCalculator />
      </section>
    </div>
  )
}
