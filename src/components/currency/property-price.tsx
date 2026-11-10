"use client";

import { convertPrice, formatPriceNumber, isDisplayCurrency, resolvePriceQuote, sourcePriceText } from "@/lib/currency";
import { DirhamSymbol, PropertyPriceText } from "@/components/properties/PropertyPriceText";
import { useCurrency } from "./currency-provider";

// One implementation of the dirham artwork and supplied-price text, shared with
// server components.
export { DirhamSymbol };

// Replace only the ISO label before a numeral; never infer an amount from copy.
export function OriginalPriceText({ text }: { text: string }) {
  return <PropertyPriceText text={text} />;
}

export function PropertyPrice({ amount, currency: sourceCurrency, displayText, period, fallback = "Price on application", prefix = "" }: {
  amount?: number;
  currency?: string;
  displayText?: string;
  period?: string;
  fallback?: string;
  prefix?: string;
}) {
  const { currency, rates, status } = useCurrency();
  const original = displayText?.trim() || (amount && sourceCurrency ? sourcePriceText(amount, sourceCurrency, period) : fallback);
  const quote = resolvePriceQuote({ amount, currency: sourceCurrency, displayText, period });
  const converted = quote && isDisplayCurrency(currency) ? convertPrice(quote.amount, quote.currency, currency, rates) : null;
  const isConverted = converted !== null && quote?.currency !== currency;
  const needsConversion = quote && isDisplayCurrency(currency) && quote.currency !== currency;
  const periodSuffix = ["week", "month", "year"].includes(quote?.period ?? "") ? ` / ${quote?.period}` : "";

  return (
    <span className="inline-block max-w-full lining-nums" data-price-currency={isConverted ? currency : quote?.currency ?? sourceCurrency}>
      {isConverted ? <>
        <span>{prefix || (quote?.from ? "From " : "Reference price ")}≈ {currency === "AED" ? <DirhamSymbol /> : currency === "GBP" ? "£" : "US$"}{formatPriceNumber(converted)}{periodSuffix}</span>
        <span className="mt-1 block font-sans text-[11px] font-normal leading-relaxed text-muted-foreground">
          Original: <OriginalPriceText text={original} />
          <span className="block">Indicative · rate {rates?.asOf}</span>
        </span>
      </> : <>
        {prefix}<OriginalPriceText text={original} />
        {needsConversion && <span className="mt-1 block font-sans text-[11px] font-normal leading-relaxed text-muted-foreground">{status === "loading" ? "Original price · loading rate" : "Original price · conversion unavailable"}</span>}
      </>}
    </span>
  );
}
