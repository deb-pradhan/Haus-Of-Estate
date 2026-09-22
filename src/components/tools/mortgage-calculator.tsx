'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, Calculator } from 'lucide-react'
import {
  calculateRepayment,
  validateRepaymentFields,
  type RepaymentEstimate,
  type RepaymentFields,
} from '@/lib/mortgage-calculator'

const FIELD_DETAILS = [
  { name: 'loanAmount', label: 'Loan amount', hint: 'The amount you plan to borrow, after your deposit.' },
  { name: 'annualRate', label: 'Annual interest rate (%)', hint: 'Use your own rate. Enter 0 for an interest-free illustration.' },
  { name: 'termYears', label: 'Loan term (years)', hint: 'A whole number from 1 to 50 years.' },
] as const

export function MortgageCalculator() {
  const [currency, setCurrency] = useState('GBP')
  const [fields, setFields] = useState<RepaymentFields>({ loanAmount: '', annualRate: '', termYears: '' })
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<RepaymentEstimate | null>(null)
  const { values, errors } = validateRepaymentFields(fields)
  const money = (amount: number) => new Intl.NumberFormat('en-GB', {
    style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!values) {
      setResult(null)
      const firstError = FIELD_DETAILS.find(({ name }) => errors[name])
      const input = firstError && event.currentTarget.elements.namedItem(firstError.name)
      if (input instanceof HTMLElement) input.focus()
      return
    }
    setResult(calculateRepayment(values))
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form noValidate onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-medium text-estate-700">Your figures</h2>
        <div className="mt-6">
          <label htmlFor="repayment-currency" className="block text-sm font-medium text-estate-700">Currency</label>
          <select
            id="repayment-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            aria-describedby="repayment-currency-hint"
            className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-estate-700"
          >
            <option value="GBP">GBP — British pound</option>
            <option value="AED">AED — UAE dirham</option>
            <option value="USD">USD — US dollar</option>
          </select>
          <p id="repayment-currency-hint" className="mt-2 text-xs leading-relaxed text-muted-foreground">Currency labels the amounts only. Changing it does not convert your figures.</p>
        </div>
        {FIELD_DETAILS.map(({ name, label, hint }) => {
          const error = submitted ? errors[name] : undefined
          return (
            <div key={name} className="mt-5">
              <label htmlFor={`repayment-${name}`} className="block text-sm font-medium text-estate-700">{label}</label>
              <input
                id={`repayment-${name}`}
                name={name}
                type="text"
                inputMode={name === 'termYears' ? 'numeric' : 'decimal'}
                value={fields[name]}
                onChange={(event) => {
                  const value = event.target.value
                  setFields((previous) => ({ ...previous, [name]: value }))
                  setResult(null)
                }}
                required
                autoComplete="off"
                maxLength={24}
                aria-invalid={Boolean(error)}
                aria-describedby={`repayment-${name}-hint${error ? ` repayment-${name}-error` : ''}`}
                className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-estate-700 aria-invalid:border-destructive"
              />
              <p id={`repayment-${name}-hint`} className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
              {error && <p id={`repayment-${name}-error`} className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
          )
        })}
        {submitted && !values && <p role="alert" className="mt-5 text-sm text-destructive">Check the highlighted fields before calculating.</p>}
        <button type="submit" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-estate-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-estate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700 focus-visible:ring-offset-2">
          Calculate monthly repayment <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <div className="rounded-2xl bg-estate-700 p-6 text-white sm:p-8">
        <Calculator className="h-7 w-7 text-gold-400" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-2xl font-medium">Repayment illustration</h2>
        <div aria-live="polite" aria-atomic="true" className="mt-7">
          {result ? (
            <>
              <p className="text-sm text-white/75">Estimated monthly repayment</p>
              <p className="mt-2 break-words font-serif text-3xl font-medium text-gold-400 sm:text-4xl">{money(result.monthlyPayment)}</p>
              <dl className="mt-7 space-y-4 border-t border-white/20 pt-6 text-sm">
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-white/75">Total interest</dt><dd className="font-semibold">{money(result.totalInterest)}</dd></div>
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-white/75">Total repaid</dt><dd className="font-semibold">{money(result.totalRepayment)}</dd></div>
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-white/75">Number of monthly payments</dt><dd className="font-semibold">{result.months}</dd></div>
              </dl>
            </>
          ) : (
            <p className="text-base leading-relaxed text-white/80">Enter your loan amount, annual interest rate and term to see an estimate.</p>
          )}
        </div>
        <div className="mt-8 border-t border-white/20 pt-6 text-sm leading-relaxed text-white/80">
          <p>This assumes equal monthly capital-and-interest repayments with the same interest rate for the entire term.</p>
          <p className="mt-3">It excludes taxes, lender fees, insurance and other purchase costs. Rounded figures are illustrative; a lender&apos;s calculation may differ.</p>
          <p className="mt-3">This is not a mortgage offer, affordability assessment or financial advice. Confirm rates, eligibility and repayments with your lender or qualified adviser.</p>
        </div>
      </div>
    </div>
  )
}
