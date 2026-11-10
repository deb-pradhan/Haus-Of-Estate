import { Fragment } from 'react'

/** Display-only currency artwork. Source currency identifiers remain ISO codes. */
export function DirhamSymbol() {
  return <>
    <span className="sr-only">AED </span>
    <svg viewBox="191 190 368 322" aria-hidden="true" focusable="false"
      className="mx-[0.15em] inline-block h-[0.8em] min-h-[12px] w-auto align-[-0.1em] [.text-white_&]:invert">
      <image href="/currency/uae-dirham.png" width="700" height="700" />
    </svg>
  </>
}

/** Preserve supplied prices, ranges and qualifiers; never convert or infer an amount. */
export function PropertyPriceText({ text }: { text: string }) {
  return <span className="lining-nums">{text.split(/\bAED\s*(?=\d)/).map((part, index) => (
    <Fragment key={index}>{index > 0 && <DirhamSymbol />}{part}</Fragment>
  ))}</span>
}
