import type { PropertyHomeType } from '@/lib/property-home-types'

const formatNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

export function PropertyHomeTypes({ rows }: { rows: PropertyHomeType[] }) {
  if (rows.length === 0) return null

  return <section className="mt-10" aria-labelledby="property-home-types-heading">
    <h2 id="property-home-types-heading" className="font-serif text-xl font-medium text-estate-700">Home types</h2>
    <p id="property-home-types-note" className="mt-2 text-sm leading-relaxed text-muted-foreground">
      Starting sizes and prices vary by home type. Confirm the current price, exact size and availability of your chosen home with Haus of Estate.
    </p>
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full table-fixed text-left text-sm" aria-describedby="property-home-types-note">
        <caption className="sr-only">Home types with starting sizes in square feet and starting prices in their source currency</caption>
        <thead className="bg-estate-700/5 text-estate-700">
          <tr>
            <th scope="col" className="w-[30%] px-3 py-3 font-medium sm:px-4">Home type</th>
            <th scope="col" className="w-[30%] px-3 py-3 font-medium sm:px-4">Starting size</th>
            <th scope="col" className="w-[40%] px-3 py-3 font-medium sm:px-4">Starting price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => <tr key={row._key} className="border-t border-border align-top">
            <th scope="row" className="break-words px-3 py-4 font-medium text-estate-700 sm:px-4">{row.label}</th>
            <td className="px-3 py-4 tabular-nums sm:px-4">{formatNumber.format(row.startingSizeSqFt)} <span className="whitespace-nowrap">sq ft</span></td>
            <td className="px-3 py-4 tabular-nums text-estate-700 sm:px-4"><span className="block text-xs sm:inline sm:text-sm">{row.priceCurrency}</span>{' '}<span className="break-words">{formatNumber.format(row.startingPrice)}</span></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>
}
