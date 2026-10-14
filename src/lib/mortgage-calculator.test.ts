import { describe, expect, it } from 'vitest'
import { calculateRepayment, validateRepaymentFields } from './mortgage-calculator'

describe('repayment estimates', () => {
  it('calculates a known 30-year amortising loan and retains precision for totals', () => {
    const result = calculateRepayment({ loanAmount: 100_000, annualRate: 6, termYears: 30 })
    expect(result.monthlyPayment).toBeCloseTo(599.550525, 6)
    expect(result.totalRepayment).toBeCloseTo(215_838.189055, 5)
    expect(result.totalInterest).toBeCloseTo(115_838.189055, 5)
    expect(result.months).toBe(360)
  })

  it('divides an interest-free loan evenly and remains stable near zero interest', () => {
    const zero = calculateRepayment({ loanAmount: 120_000, annualRate: 0, termYears: 10 })
    expect(zero).toEqual({ monthlyPayment: 1_000, totalRepayment: 120_000, totalInterest: 0, months: 120 })
    const tiny = calculateRepayment({ loanAmount: 120_000, annualRate: 0.0000000001, termYears: 10 })
    expect(tiny.monthlyPayment).toBeCloseTo(1_000, 6)
    expect(tiny.totalInterest).toBeGreaterThanOrEqual(0)
  })

  it.each([
    { loanAmount: 0 }, { loanAmount: -10 }, { loanAmount: Infinity }, { loanAmount: 1_000_000_001 },
    { annualRate: NaN }, { annualRate: -1 }, { annualRate: 101 },
    { termYears: 0 }, { termYears: 51 }, { termYears: 2.5 },
  ])('rejects unsupported numeric values: %j', (invalid) => {
    expect(() => calculateRepayment({ loanAmount: 100_000, annualRate: 5, termYears: 25, ...invalid })).toThrow(RangeError)
  })
})

describe('calculator input validation', () => {
  it('keeps blank values invalid without silently assigning a zero rate', () => {
    const result = validateRepaymentFields({ loanAmount: '', annualRate: ' ', termYears: '' })
    expect(result.values).toBeNull()
    expect(Object.keys(result.errors)).toEqual(['loanAmount', 'annualRate', 'termYears'])
  })

  it('accepts explicit zero interest and decimal rates', () => {
    expect(validateRepaymentFields({ loanAmount: '120000', annualRate: '0', termYears: '10' }).values)
      .toEqual({ loanAmount: 120000, annualRate: 0, termYears: 10 })
    expect(validateRepaymentFields({ loanAmount: '120000.50', annualRate: '.5', termYears: '10' }).values?.annualRate).toBe(0.5)
  })

  it.each(['100,000', '£1000', '1e5', '0x10', 'Infinity', '10junk'])('does not silently coerce an ambiguous amount: %s', (loanAmount) => {
    expect(validateRepaymentFields({ loanAmount, annualRate: '5', termYears: '25' }).errors.loanAmount).toBeDefined()
  })
})
