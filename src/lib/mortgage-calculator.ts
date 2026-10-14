export interface RepaymentInputs {
  loanAmount: number
  annualRate: number
  termYears: number
}

export interface RepaymentEstimate {
  monthlyPayment: number
  totalRepayment: number
  totalInterest: number
  months: number
}

export type RepaymentFields = Record<keyof RepaymentInputs, string>
export type RepaymentErrors = Partial<Record<keyof RepaymentInputs, string>>

const DECIMAL = /^(?:\d+|\d*\.\d+)$/

export function validateRepaymentFields(fields: RepaymentFields): {
  values: RepaymentInputs | null
  errors: RepaymentErrors
} {
  const errors: RepaymentErrors = {}
  const loanAmount = Number(fields.loanAmount.trim())
  const annualRate = Number(fields.annualRate.trim())
  const termYears = Number(fields.termYears.trim())

  if (!DECIMAL.test(fields.loanAmount.trim()) || !Number.isFinite(loanAmount) || loanAmount <= 0 || loanAmount > 1_000_000_000) {
    errors.loanAmount = 'Enter a loan amount greater than 0 and no more than 1,000,000,000, without commas or currency symbols.'
  }
  if (!DECIMAL.test(fields.annualRate.trim()) || !Number.isFinite(annualRate) || annualRate < 0 || annualRate > 100) {
    errors.annualRate = 'Enter an annual interest rate from 0 to 100.'
  }
  if (!/^\d+$/.test(fields.termYears.trim()) || !Number.isInteger(termYears) || termYears < 1 || termYears > 50) {
    errors.termYears = 'Enter a whole number of years from 1 to 50.'
  }

  return {
    values: Object.keys(errors).length === 0 ? { loanAmount, annualRate, termYears } : null,
    errors,
  }
}

/** Equal monthly capital-and-interest payments, paid at the end of each month. */
export function calculateRepayment({ loanAmount, annualRate, termYears }: RepaymentInputs): RepaymentEstimate {
  if (!Number.isFinite(loanAmount) || loanAmount <= 0 || loanAmount > 1_000_000_000
    || !Number.isFinite(annualRate) || annualRate < 0 || annualRate > 100
    || !Number.isInteger(termYears) || termYears < 1 || termYears > 50) {
    throw new RangeError('Repayment inputs are outside the supported range.')
  }

  const months = termYears * 12
  const monthlyRate = annualRate / 1200
  // log1p/expm1 retain precision when a small positive rate approaches zero.
  const monthlyPayment = monthlyRate === 0
    ? loanAmount / months
    : loanAmount * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate))
  const totalRepayment = monthlyPayment * months

  return {
    monthlyPayment,
    totalRepayment,
    totalInterest: Math.max(0, totalRepayment - loanAmount),
    months,
  }
}
