'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search } from 'lucide-react'
import type { PropertyLocationGroup } from '@/lib/property-locations'
import { propertyLocationKey } from '@/lib/property-locations'
import { hasShowcaseFilters, showcaseSearchHref, type ShowcaseSearch } from '@/lib/showcase/search'
import { showcasePath } from '@/lib/showcase/access'
import { cn } from '@/lib/utils'

const fieldClass = 'mt-1.5 min-h-12 w-full min-w-0 rounded-xl border border-estate-700/20 bg-white px-3.5 text-base text-estate-700 shadow-sm disabled:bg-stone-100 disabled:text-estate-700/50 sm:text-sm'

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block min-w-0 text-xs font-semibold tracking-wide text-estate-700', className)}>
      {label}
      {children}
    </label>
  )
}

/**
 * Country → city → area, then type, bedrooms and a keyword. The options come
 * from the fixture, so a buyer only sees places that have homes to show.
 */
export function ShowcaseSearchForm({ locations, types, bedrooms, initial = {}, variant = 'hero' }: {
  locations: PropertyLocationGroup[]
  types: string[]
  bedrooms: number[]
  initial?: ShowcaseSearch
  variant?: 'hero' | 'bar'
}) {
  const router = useRouter()
  const id = useId()
  const [pending, startTransition] = useTransition()
  const [country, setCountry] = useState(initial.country ?? '')
  const [city, setCity] = useState(initial.city ?? '')
  const [area, setArea] = useState(initial.area ?? '')
  const [type, setType] = useState(initial.type ?? '')
  const [beds, setBeds] = useState(initial.beds === undefined ? '' : String(initial.beds))
  const [q, setQ] = useState(initial.q ?? '')

  const countryGroup = locations.find((group) => propertyLocationKey(group.country) === propertyLocationKey(country))
  const cities = countryGroup?.cities ?? []
  const cityKey = cities.find((value) => propertyLocationKey(value) === propertyLocationKey(city))
  const areas = cityKey ? countryGroup?.areasByCity[cityKey] ?? [] : []

  function currentSearch(): ShowcaseSearch {
    const parsedBeds = Number.parseInt(beds, 10)
    return {
      country: country || undefined,
      city: city || undefined,
      area: area || undefined,
      type: type || undefined,
      beds: Number.isInteger(parsedBeds) ? parsedBeds : undefined,
      q: q.trim() || undefined,
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(() => router.push(showcaseSearchHref(currentSearch())))
  }

  const showClear = variant === 'bar' && hasShowcaseFilters(initial)

  return (
    <form role="search" aria-label="Find a home" method="get" action={showcasePath('/properties')} onSubmit={submit}
      className={cn('w-full rounded-3xl border border-estate-700/10 bg-surface text-left shadow-lg shadow-black/5', variant === 'hero' ? 'p-4 sm:p-6' : 'p-4 sm:p-5')}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Country">
          <select id={`${id}-country`} name="country" value={country} onChange={(event) => { setCountry(event.target.value); setCity(''); setArea('') }} className={fieldClass}>
            <option value="">All countries</option>
            {locations.map((group) => <option key={group.country} value={group.country}>{group.country}</option>)}
          </select>
        </Field>
        <Field label="City">
          <select id={`${id}-city`} name="city" value={cityKey ?? city} disabled={!country || !cities.length} onChange={(event) => { setCity(event.target.value); setArea('') }} className={fieldClass}>
            <option value="">{country ? 'All cities' : 'Choose a country first'}</option>
            {cities.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </Field>
        <Field label="Area or community">
          <select id={`${id}-area`} name="area" value={area} disabled={!cityKey || !areas.length} onChange={(event) => setArea(event.target.value)} className={fieldClass}>
            <option value="">{cityKey ? 'All areas' : 'Choose a city first'}</option>
            {areas.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Home type">
          <select id={`${id}-type`} name="type" value={type} onChange={(event) => setType(event.target.value)} className={fieldClass}>
            <option value="">All types</option>
            {types.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </Field>
        <Field label="Bedrooms">
          <select id={`${id}-beds`} name="beds" value={beds} onChange={(event) => setBeds(event.target.value)} className={fieldClass}>
            <option value="">Any</option>
            {bedrooms.map((value) => <option key={value} value={value}>{value === 0 ? 'Studio' : `${value}+`}</option>)}
          </select>
        </Field>
        <Field label="Community, design or keyword" className="col-span-2 sm:col-span-1">
          <input id={`${id}-q`} name="q" type="search" maxLength={120} value={q} onChange={(event) => setQ(event.target.value)} placeholder="e.g. Florence, Spada, North London" className={fieldClass} />
        </Field>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          {variant === 'hero' ? 'Showing one Sharjah community and one North London home from the review fixture.' : 'Change any filter and search again, or clear them to see everything.'}
        </p>
        <div className="flex items-center gap-3">
          {showClear && <Link href={showcasePath('/properties')} className="inline-flex min-h-12 items-center px-2 text-sm font-medium text-estate-700 underline underline-offset-4">Clear filters</Link>}
          <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-estate-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-estate-600 disabled:opacity-60 sm:w-auto">
            <Search aria-hidden className="size-4" />
            {pending ? 'Searching…' : 'Search homes'}
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </form>
  )
}
