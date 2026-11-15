import type { Ref } from 'react'

/** Marks a field the form cannot be sent without; optional fields say so too. */
export function RequiredMark() {
  return <span className="font-normal text-muted-foreground"> (required)</span>
}

/**
 * The list of problems shown above a form after a failed submit. It takes focus
 * so the problems are announced once, and each item links to its field.
 */
export function ErrorSummary({ errors, fieldIds, ref }: {
  errors: [string, string][]
  /** Field key to the id of its control. Keys without an entry are listed as plain text. */
  fieldIds: Record<string, string>
  ref?: Ref<HTMLDivElement>
}) {
  if (!errors.length) return null
  return (
    <div ref={ref} tabIndex={-1} role="alert" data-error-summary className="mt-4 rounded-xl border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p className="font-semibold">
        {errors.length === 1 ? 'There is a problem to fix:' : `There are ${errors.length} problems to fix:`}
      </p>
      <ul className="mt-1 list-disc pl-5">
        {errors.map(([key, message]) => (
          <li key={key}>
            {fieldIds[key]
              ? <a href={`#${fieldIds[key]}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">{message}</a>
              : message}
          </li>
        ))}
      </ul>
    </div>
  )
}
