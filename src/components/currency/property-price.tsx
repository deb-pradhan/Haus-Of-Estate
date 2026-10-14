"use client";

import { convertPrice, formatPriceNumber, isDisplayCurrency, resolvePriceQuote, sourcePriceText } from "@/lib/currency";
import { useCurrency } from "./currency-provider";

function DirhamSymbol() {
  // The viewBox removes only transparent canvas around CBUAE's original PNG.
  // Its outline and proportions are unchanged; the source asset stays intact.
  // Give the artwork a small descent to align with the numerals. Both metrics
  // scale with the text, including the smaller original-price conversion note.
  return <><span className="sr-only">AED </span><svg viewBox="191 190 368 322" aria-hidden="true" className="mx-[0.15em] inline-block h-[0.8em] w-auto align-[-0.1em] [.text-white_&]:invert"><image href="/currency/uae-dirham.png" width="700" height="700" /></svg></>;
}

// Replace only the ISO label before a numeral; never infer an amount from copy.
export function OriginalPriceText({ text }: { text: string }) {
  return <>{text.split(/\bAED\s*(?=\d)/).map((part, index) => <span key={index} className="lining-nums">{index > 0 && <DirhamSymbol />}{part}</span>)}</>;
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
