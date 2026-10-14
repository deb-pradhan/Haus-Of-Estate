"use client";

import { useId } from "react";
import { isCurrencyChoice } from "@/lib/currency";
import { useCurrency } from "./currency-provider";

export function CurrencySelector() {
  const { currency, setCurrency, rates, status } = useCurrency();
  const id = useId();
  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold text-estate-700 hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-estate-700 [&::-webkit-details-marker]:hidden" aria-label={`Display currency: ${currency === "original" ? "Original currency" : currency}`}>
        {currency === "original" ? "Currency" : currency}<span aria-hidden="true" className="text-[10px]">▾</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-surface p-4 text-estate-700 shadow-xl">
        <label htmlFor={id} className="text-sm font-medium">Display currency</label>
        <select id={id} value={currency} onChange={event => { if (isCurrencyChoice(event.target.value)) setCurrency(event.target.value); }} className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-estate-700" aria-describedby={`${id}-rates`}>
          <option value="original">Original currency</option>
          <option value="AED">AED — UAE dirham</option>
          <option value="GBP">GBP — British pound</option>
          <option value="USD">USD — US dollar</option>
        </select>
        <p id={`${id}-rates`} role="status" className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {currency === "original" ? "Prices are shown in their listed currencies." : status === "ready" && rates ? <>Indicative daily rates · <time dateTime={rates.asOf}>{rates.asOf}</time>. Source: <a className="underline underline-offset-2" href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer">Frankfurter</a>.</> : status === "loading" ? "Loading exchange rates. Original prices are shown until ready." : "Exchange rates are unavailable. Original prices are shown."}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Conversions are estimates; bank rates and fees may differ. Original listing prices are shown for reference.</p>
      </div>
    </details>
  );
}
