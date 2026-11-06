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
  ALL_UNIT_TYPES,
  type Category,
  type Intent,
  typesFor,
  type PropertyQuery,
} from "@/lib/property-taxonomy";
import { propertyLocationKey, type PropertyLocationGroup } from "@/lib/property-locations";
import { trackAnalytics } from "@/lib/analytics";
import { searchAmount } from "@/lib/property-search";

const fieldClass =
  "mt-1 min-h-12 w-full min-w-0 rounded-lg border border-estate-700/15 bg-white px-3 text-base font-normal text-estate-700 focus:outline-2 focus:outline-estate-700 sm:text-sm";

export function PropertySearchForm({
  initial = {},
}: {
  initial?: PropertyQuery;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState<Category | "">(
    isCategory(initial.category) ? initial.category : initial.category === "" ? "" : "residential",
  );
  const [intent, setIntent] = useState<Intent | "">(
    initial.intent === "rent" ? "rent" : initial.intent === "" ? "" : "sale",
  );
  const [availability, setAvailability] = useState(initial.availability ?? "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [area, setArea] = useState(initial.area ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [type, setType] = useState(initial.type ?? "");
  const [beds, setBeds] = useState(initial.beds ?? "");
  const [query, setQuery] = useState(initial.q ?? "");
  const [minimum, setMinimum] = useState(initial.minPrice ?? "");
  const [maximum, setMaximum] = useState(initial.maxPrice ?? "");
  const [currency, setCurrency] = useState(initial.currency ?? "GBP");
  const [locations, setLocations] = useState<PropertyLocationGroup[]>([]);
  const [locationStatus, setLocationStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationAttempt, setLocationAttempt] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/property-locations", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Locations unavailable");
        const result = (await response.json()) as {
          locations?: PropertyLocationGroup[];
        };
        if (!Array.isArray(result.locations)) throw new Error("Invalid locations");
        if (!controller.signal.aborted) {
          setLocations(result.locations);
          setLocationStatus("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLocationStatus("error");
      });
    return () => controller.abort();
  }, [locationAttempt]);

  const countryValues = [
      ...PROPERTY_MARKETS.map((market) => market.country),
      ...locations.map((group) => group.country),
      ...(country ? [country] : []),
  ];
  const countries = countryValues.filter((value, index) => countryValues.findIndex((item) => propertyLocationKey(item) === propertyLocationKey(value)) === index);
  const countryKey = countries.find((value) => propertyLocationKey(value) === propertyLocationKey(country));
  const locationGroup = locations.find((group) => propertyLocationKey(group.country) === propertyLocationKey(country));
  const cities = locationGroup?.cities ?? [];
  const cityKey = cities.find((value) => propertyLocationKey(value) === propertyLocationKey(city));
  const areas = cityKey ? locationGroup?.areasByCity?.[cityKey] ?? [] : [];
  const areaKey = areas.find((value) => propertyLocationKey(value) === propertyLocationKey(area));
  // Existing bookmarked filters remain selectable while the options are loading or unavailable.
  const cityOptions = [...new Set([...cities, ...(city && !cityKey ? [city] : [])])];
  const areaOptions = [...new Set([...areas, ...(area && !areaKey ? [area] : [])])];
  const hideBeds = bedroomsHidden(category, type);
  const types = category ? typesFor(
    category,
    isAvailability(availability) ? availability : undefined,
  ) : ALL_UNIT_TYPES;
  const availableTypes = [...new Set([...types, ...(type ? [type] : [])])];

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
      ...(category ? { category } : {}),
      ...(intent ? { intent } : {}),
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
          area,
          location,
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
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Country">
          <select
            aria-label="Country of interest"
            value={countryKey ?? country}
            onChange={(event) => {
              setCountry(event.target.value);
              setCity("");
              setArea("");
              setLocation("");
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
            value={cityKey ?? city}
            disabled={!country || !cityOptions.length}
            onChange={(event) => {
              setCity(event.target.value);
              setArea("");
              setLocation("");
            }}
            className={`${fieldClass} disabled:bg-stone-50 disabled:text-estate-700/50`}
          >
            <option value="">
              {!country ? "Choose a country first" : locationStatus === "loading" ? "Loading cities…" : "All cities"}
            </option>
            {cityOptions.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label="Area / community">
          <select
            aria-label="Area of interest"
            value={areaKey ?? area}
            disabled={!country || !city || !areaOptions.length}
            onChange={(event) => setArea(event.target.value)}
            className={`${fieldClass} disabled:bg-stone-50 disabled:text-estate-700/50`}
          >
            <option value="">{!city ? "Choose a city first" : locationStatus === "loading" ? "Loading areas…" : "All areas"}</option>
            {areaOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </Field>
      </div>
      {locationStatus === "error" && (
        <div role="status" className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-estate-700/80">
          <p>City and area options couldn’t load. You can still search by name below.</p>
          <button type="button" onClick={() => {
            setLocationStatus("loading");
            setLocationAttempt((value) => value + 1);
          }} className="min-h-11 underline underline-offset-4">Retry locations</button>
        </div>
      )}
      {locationStatus === "ready" && country && (!cities.length || (city && !areas.length)) && (
        <p role="status" className="mt-2 text-sm text-estate-700/70">
          {!cities.length ? "No published city options for this country yet. You can search the whole country." : "No area options for this city yet. You can search the whole city."}
        </p>
      )}
      <div className={`mt-4 grid grid-cols-2 gap-3 ${hideBeds ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
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
            {availableTypes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        {!hideBeds && (
          <Field label="Bedrooms">
            <select
              aria-label="Bedrooms"
              value={beds}
              onChange={(event) => setBeds(event.target.value)}
              className={fieldClass}
            >
              <option value="">Any</option>
              {[0, 1, 2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  {value === 0 ? "Studio" : `${value}+`}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="col-span-2 sm:col-span-1">
          <Field label="Property, project or keyword">
            <input
              type="search"
              aria-label="Property, project or keyword"
              maxLength={120}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. Florence or North London"
              className={fieldClass}
            />
          </Field>
        </div>
      </div>
      <details open={Boolean(initial.minPrice || initial.maxPrice || initial.availability)} className="mt-4 border-t border-estate-700/10 pt-1">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-estate-700">
          Price and more filters
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          {!category && !intent ? "Searching all property categories, for sale and rent." : "Explore our published property collection."}
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
