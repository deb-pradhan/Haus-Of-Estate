'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterSegment {
  label: string
  href: string
  active: boolean
}

interface FilterBarProps {
  /** Segmented "Looking for" links (buy / rent / off-plan). Work without JS. */
  segments: FilterSegment[]
  /** Hidden params carried through the form (category, availability, intent). */
  carry: Record<string, string>
  location: string
  locationOptions: FilterOption[]
  type: string
  typeOptions: FilterOption[]
  beds: string
  bedsOptions: FilterOption[] | null
  sort: string
  sortOptions: FilterOption[]
}

/**
 * Search and filter bar. A plain GET form to /properties (so it works with
 * JavaScript off); with JavaScript it submits as soon as a select changes and
 * navigates client-side with a clean, shareable URL (empty values omitted).
 */
export function FilterBar(props: FilterBarProps) {
  const { segments, carry, locationOptions, typeOptions, bedsOptions, sortOptions } = props
  const router = useRouter()
  const [values, setValues] = useState({
    location: props.location,
    type: props.type,
    beds: props.beds,
    sort: props.sort,
  })

  // Keep the controls in step with the URL (chips, back button, segments).
  const urlKey = `${props.location}|${props.type}|${props.beds}|${props.sort}`
  const [seenKey, setSeenKey] = useState(urlKey)
  if (seenKey !== urlKey) {
    setSeenKey(urlKey)
    setValues({
      location: props.location,
      type: props.type,
      beds: props.beds,
      sort: props.sort,
    })
  }

  function submit(form: HTMLFormElement, override?: [string, string]) {
    const data = new FormData(form)
    if (override) data.set(override[0], override[1])
    const qs = new URLSearchParams()
    for (const [key, value] of data.entries()) {
      if (typeof value === 'string' && value !== '' && !(key === 'sort' && value === 'featured')) {
        qs.set(key, value)
      }
    }
    const query = qs.toString()
    router.push(query ? `/properties?${query}` : '/properties', { scroll: false })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(event.currentTarget)
  }

  function change(name: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [name]: event.target.value }))
      const form = event.target.form
      if (form) submit(form, [name, event.target.value])
    }
  }

  return (
    <div className="rounded-[28px] bg-surface p-4 shadow-e2 md:p-6">
      <div
        role="group"
        aria-label="Looking for"
        className="flex flex-wrap gap-1 rounded-full bg-estate-700/[0.06] p-1 sm:inline-flex"
      >
        {segments.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            scroll={false}
            aria-current={s.active ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors sm:px-5 duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-estate-700/60 sm:flex-none',
              s.active
                ? 'bg-estate-700 text-white shadow-e1'
                : 'text-estate-900 hover:bg-white',
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <form
        action="/properties"
        method="get"
        onSubmit={onSubmit}
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end"
      >
        {Object.entries(carry).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

        <SelectField
          id="filter-location"
          name="location"
          label="Location"
          value={values.location}
          onChange={change('location')}
          options={locationOptions}
          anyLabel="Anywhere"
        />
        <SelectField
          id="filter-type"
          name="type"
          label="Property type"
          value={values.type}
          onChange={change('type')}
          options={typeOptions}
          anyLabel="Any type"
        />
        {bedsOptions ? (
          <SelectField
            id="filter-beds"
            name="beds"
            label="Bedrooms"
            value={values.beds}
            onChange={change('beds')}
            options={bedsOptions}
            anyLabel="Any"
          />
        ) : (
          <div className="hidden lg:block" aria-hidden="true" />
        )}
        <SelectField
          id="filter-sort"
          name="sort"
          label="Sort by"
          value={values.sort}
          onChange={change('sort')}
          options={sortOptions}
        />
        <Button type="submit" size="lg" className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto">
          <Search aria-hidden="true" />
          Update results
        </Button>
      </form>
    </div>
  )
}

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  options,
  anyLabel,
}: {
  id: string
  name: string
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: FilterOption[]
  anyLabel?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-estate-900">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className="h-12 w-full appearance-none rounded-xl border border-input bg-white px-4 pr-10 text-base text-ink-900 shadow-xs outline-none transition-[box-shadow,border-color] focus-visible:border-estate-700 focus-visible:ring-[3px] focus-visible:ring-estate-700/35"
        >
          {anyLabel !== undefined && <option value="">{anyLabel}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  )
}
