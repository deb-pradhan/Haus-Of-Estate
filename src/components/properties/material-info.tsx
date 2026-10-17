import { Download } from 'lucide-react'

export interface InfoRow {
  label: string
  value: string
}

export interface InfoGroup {
  heading: string
  rows: InfoRow[]
}

/**
 * Material information panel. Renders only the rows and groups that exist in
 * the data; nothing is defaulted or implied. Intended for the key facts a
 * buyer needs before enquiring (price basis, tenure, costs, completion,
 * developer, regulatory references).
 */
export function MaterialInfo({
  groups,
  brochureUrl,
  priceNote,
}: {
  groups: InfoGroup[]
  brochureUrl?: string
  priceNote: string
}) {
  const visible = groups.filter((g) => g.rows.length > 0)
  if (visible.length === 0 && !brochureUrl) return null

  return (
    <section aria-labelledby="material-info-heading" className="scroll-mt-24">
      <h2
        id="material-info-heading"
        className="font-serif text-[length:var(--text-title-3)] font-medium text-estate-900"
      >
        Property information
      </h2>
      <div className="mt-5 divide-y divide-hairline overflow-hidden rounded-[20px] bg-surface shadow-e1">
        {visible.map((group) => (
          <div key={group.heading} className="px-5 py-5 md:px-6">
            <h3 className="eyebrow">{group.heading}</h3>
            <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {group.rows.map((row) => (
                <div key={row.label} className="flex flex-col">
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-base font-medium text-ink-900 tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        {brochureUrl && (
          <div className="px-5 py-4 md:px-6">
            <a
              href={brochureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-medium text-estate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-estate-700/60"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Download brochure
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{priceNote}</p>
    </section>
  )
}
