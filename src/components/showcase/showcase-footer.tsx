import Image from 'next/image'
import Link from 'next/link'
import { COMPANY_IDENTITY } from '@/lib/company-identity'
import { showcasePath, showcasePropertyPath } from '@/lib/showcase/access'

const SALES_EMAIL = 'sales@hausofestate.com'
const CAREERS_EMAIL = 'careers@hausofestate.com'

const linkClass = 'inline-flex min-h-11 items-center text-sm text-white/75 underline-offset-4 hover:text-white hover:underline'

export function ShowcaseFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="sc-on-dark mt-auto bg-estate-700 text-white/75">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <p className="font-serif text-2xl font-medium tracking-wide text-white">Haus of Estate</p>
          <p className="mt-3 max-w-sm text-sm leading-6">
            An international property service for buyers, landlords and investors, across the UK and selected international markets.
          </p>
          <div className="mt-5 space-y-1 text-xs leading-5 text-white/65">
            <p className="font-semibold text-white/85">{COMPANY_IDENTITY.legalName}</p>
            <p>
              Registered in {COMPANY_IDENTITY.registeredJurisdiction}.{' '}
              <a href={COMPANY_IDENTITY.companiesHouseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-white">
                Company number {COMPANY_IDENTITY.number}
              </a>
            </p>
            <p>
              <a href={COMPANY_IDENTITY.icoRegisterUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-white">
                ICO registration {COMPANY_IDENTITY.icoRegistrationNumber}
              </a>
            </p>
            <p>{COMPANY_IDENTITY.registeredOffice}</p>
          </div>
          <Image src="/badges/policybee-insured-white.png" alt="Insured through PolicyBee" width={80} height={80} sizes="80px" className="mt-5 h-20 w-20 object-contain" />
        </div>
        <nav aria-label="Showcase pages">
          <p className="sc-eyebrow sc-eyebrow--light">Showcase</p>
          <ul className="mt-3 space-y-1">
            <li><Link href={showcasePath()} className={linkClass}>Overview</Link></li>
            <li><Link href={showcasePath('/properties')} className={linkClass}>Find a home</Link></li>
            <li><Link href={showcasePropertyPath('azizi-florence')} className={linkClass}>Azizi Florence, Sharjah</Link></li>
            <li><Link href={showcasePropertyPath('north-london-three-bedroom-property')} className={linkClass}>North London home</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="sc-eyebrow sc-eyebrow--light">Legal</p>
          <ul className="mt-3 space-y-1">
            <li><Link href="/legal/privacy-policy" className={linkClass}>Privacy policy</Link></li>
            <li><Link href="/legal/terms-of-service" className={linkClass}>Terms of service</Link></li>
            <li><Link href="/legal/cookie-policy" className={linkClass}>Cookie policy</Link></li>
          </ul>
        </nav>
        <div>
          <p className="sc-eyebrow sc-eyebrow--light">Contact</p>
          <ul className="mt-3 space-y-1">
            <li><a href={`mailto:${SALES_EMAIL}`} className={linkClass}>{SALES_EMAIL}</a></li>
            <li><a href={`mailto:${CAREERS_EMAIL}`} className={linkClass}>{CAREERS_EMAIL}</a></li>
          </ul>
          <p className="mt-3 text-xs leading-5 text-white/60">Sales enquiries go to the sales inbox; recruitment questions to careers. Nothing on these showcase pages sends a message for you.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/55 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {year} {COMPANY_IDENTITY.legalName}. All rights reserved.</p>
          <p>Fixture prepared 6 November 2026. Architectural renders are illustrations, not photographs of completed homes.</p>
        </div>
      </div>
    </footer>
  )
}
