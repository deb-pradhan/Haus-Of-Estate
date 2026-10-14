"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { isCurrencyChoice, parseExchangeRates, type CurrencyChoice, type ExchangeRates } from "@/lib/currency";

export const CURRENCY_STORAGE_KEY = "haus:display-currency:v1";
const CHANGE_EVENT = "haus:display-currency";
let sessionCurrency: CurrencyChoice | null = null;

function subscribeCurrency(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CURRENCY_STORAGE_KEY || event.key === null) {
      sessionCurrency = null;
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function readCurrency(): CurrencyChoice {
  if (sessionCurrency) return sessionCurrency;
  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isCurrencyChoice(stored) ? stored : "original";
  } catch { return "original"; }
}

function setCurrency(currency: CurrencyChoice) {
  sessionCurrency = currency;
  try { window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency); } catch { /* This tab can still remember the choice. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const CurrencyContext = createContext<{
  currency: CurrencyChoice;
  setCurrency: (currency: CurrencyChoice) => void;
  rates: ExchangeRates | null;
  status: "loading" | "ready" | "unavailable";
}>({ currency: "original", setCurrency: () => {}, rates: null, status: "loading" });

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore<CurrencyChoice>(subscribeCurrency, readCurrency, () => "original");
  const [state, setState] = useState<{ rates: ExchangeRates | null; status: "loading" | "ready" | "unavailable" }>({ rates: null, status: "loading" });

  useEffect(() => {
    if (currency === "original") return;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/exchange-rates", { signal: controller.signal });
        if (!response.ok) throw new Error("Unavailable");
        const rates = parseExchangeRates(await response.json());
        if (!rates) throw new Error("Invalid rates");
        setState({ rates, status: "ready" });
      } catch {
        if (!controller.signal.aborted) setState({ rates: null, status: "unavailable" });
      }
    }
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60 * 60 * 1000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [currency]);

  return <CurrencyContext.Provider value={{ currency, setCurrency, ...state }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() { return useContext(CurrencyContext); }
