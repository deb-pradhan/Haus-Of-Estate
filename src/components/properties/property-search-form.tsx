"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import {
  PROPERTY_MARKETS,
  PROPERTY_SEARCH_MODES,
} from "@/lib/property-markets";
import {
  bedroomsHidden,
  buildPropertiesHref,
  isAvailability,
  isCategory,
  typesFor,
  type PropertyQuery,
} from "@/lib/property-taxonomy";
import type { PropertyLocationGroup } from "@/lib/property-locations";
import { trackAnalytics } from "@/lib/analytics";
import { searchAmount } from "@/lib/property-search";

const fieldClass =
  "mt-1 min-h-11 w-full min-w-0 rounded-lg border border-estate-700/15 bg-white px-3 text-sm font-normal text-estate-700 focus:outline-2 focus:outline-estate-700";

export function PropertySearchForm({
  initial = {},
}: {
  initial?: PropertyQuery;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState(
    isCategory(initial.category) ? initial.category : "residential",
  );
  const [intent, setIntent] = useState(
    initial.intent === "rent" ? "rent" : "sale",
  );
  const [availability, setAvailability] = useState(initial.availability ?? "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [type, setType] = useState(initial.type ?? "");
  const [beds, setBeds] = useState(initial.beds ?? "");
  const [query, setQuery] = useState(initial.q ?? "");
  const [minimum, setMinimum] = useState(initial.minPrice ?? "");
  const [maximum, setMaximum] = useState(initial.maxPrice ?? "");
  const [currency, setCurrency] = useState(initial.currency ?? "GBP");
  const [locations, setLocations] = useState<PropertyLocationGroup[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/property-locations", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as {
          locations?: PropertyLocationGroup[];
        };
        if (!controller.signal.aborted) setLocations(result.locations ?? []);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const countries = [
    ...new Set([
      ...PROPERTY_MARKETS.map((market) => market.country),
      ...locations.map((group) => group.country),
      ...(country ? [country] : []),
    ]),
  ];
  const cities =
    locations.find((group) => group.country === country)?.cities ?? [];
  const hideBeds = bedroomsHidden(category, type);
  const types = typesFor(
    category,
    isAvailability(availability) ? availability : undefined,
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      [minimum, maximum].some(
        (value) => value !== "" && searchAmount(String(value)) === null,
      )
    ) {
      setError("Enter a valid price with up to two decimal places.");
      return;
    }
    if (minimum !== "" && maximum !== "" && Number(minimum) > Number(maximum)) {
      setError("Maximum price must be at least the minimum price.");
      return;
    }
    setError("");
    trackAnalytics("haus_property_search", {
      category,
      intent,
      ...(isAvailability(availability) ? { availability } : {}),
    });
    startTransition(() =>
      router.push(
        buildPropertiesHref({
          category,
          intent,
          availability: intent === "rent" ? "ready" : availability || undefined,
          country,
          city,
          type,
          beds: hideBeds ? undefined : beds,
          q: query,
          minPrice: minimum,
          maxPrice: maximum,
          currency: minimum !== "" || maximum !== "" ? currency : undefined,
        }),
      ),
    );
  }

  return (
    <form
      onSubmit={submit}
      aria-label="Find a property"
      className="mx-auto w-full max-w-6xl rounded-2xl border border-estate-700/10 bg-white p-4 text-left text-estate-700 shadow-lg shadow-black/5 sm:p-6"
    >
      <div
        role="group"
        aria-label="Property search type"
        className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-estate-700/5 p-1 sm:grid-cols-4"
      >
        {PROPERTY_SEARCH_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            aria-pressed={category === mode.category && intent === mode.intent}
            onClick={() => {
              setCategory(mode.category);
              setIntent(mode.intent);
              setType("");
              setBeds("");
              setMinimum("");
              setMaximum("");
              if (mode.intent === "rent") setAvailability("ready");
              else if (intent === "rent") setAvailability("");
            }}
            className={`min-h-11 rounded-lg px-2 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-estate-700 ${category === mode.category && intent === mode.intent ? "bg-estate-700 text-white shadow-sm" : "hover:bg-white"}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Country">
          <select
            aria-label="Country of interest"
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setCity("");
            }}
            className={fieldClass}
          >
            <option value="">All countries</option>
            {countries.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label="City">
          <select
            aria-label="City of interest"
            value={city}
            disabled={!country || !cities.length}
            onChange={(event) => setCity(event.target.value)}
            className={`${fieldClass} disabled:bg-stone-50 disabled:text-estate-700/50`}
          >
            <option value="">
              {country ? "All cities" : "Choose a country first"}
            </option>
            {[...new Set([...cities, ...(city ? [city] : [])])].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field
          label={
            category === "commercial"
              ? "Commercial property type"
              : "Property type"
          }
        >
          <select
            aria-label="Property type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={fieldClass}
          >
            <option value="">All types</option>
            {types.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        {!hideBeds ? (
          <Field label="Bedrooms">
            <select
              aria-label="Bedrooms"
              value={beds}
              onChange={(event) => setBeds(event.target.value)}
              className={fieldClass}
            >
              <option value="">Any bedrooms</option>
              {[0, 1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value === 0 ? "Studio" : `${value}+ bedrooms`}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Location or project">
            <input
              type="search"
              aria-label="Location or project"
              maxLength={120}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Area, project or developer"
              className={fieldClass}
            />
          </Field>
        )}
      </div>
      <details className="mt-4 border-t border-estate-700/10 pt-3">
        <summary className="w-fit cursor-pointer py-1 text-sm font-medium">
          Price and more filters
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {!hideBeds && (
            <Field label="Location or project">
              <input
                type="search"
                aria-label="Location or project"
                maxLength={120}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Area, project or developer"
                className={fieldClass}
              />
            </Field>
          )}
          {intent === "sale" && (
            <Field label="Availability">
              <select
                aria-label="Availability"
                value={availability}
                onChange={(event) => {
                  setAvailability(event.target.value);
                  setType("");
                }}
                className={fieldClass}
              >
                <option value="">Ready and off-plan</option>
                <option value="ready">Ready</option>
                <option value="off-plan">Off-plan</option>
              </select>
            </Field>
          )}
          <Field label="Listed price currency">
            <select
              aria-label="Price filter currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className={fieldClass}
            >
              {["GBP", "AED", "USD"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field
            label={intent === "rent" ? "Min. rent / month" : "Minimum price"}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              placeholder="No minimum"
              className={fieldClass}
            />
          </Field>
          <Field
            label={intent === "rent" ? "Max. rent / month" : "Maximum price"}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={maximum}
              onChange={(event) => setMaximum(event.target.value)}
              placeholder="No maximum"
              className={fieldClass}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-estate-700/65">
          Budget filters use the listed currency, without currency conversion.
          Prices on application are included when no budget is set.
          {intent === "rent" && " Rent is compared per month."}
        </p>
      </details>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-estate-700/65">
          Explore our published property collection.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-estate-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-estate-600 disabled:opacity-60 sm:w-auto"
        >
          <Search className="size-4" />
          {pending ? "Searching…" : "Search properties"}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0 text-xs font-semibold tracking-wide text-estate-700">
      {label}
      {children}
    </label>
  );
}
