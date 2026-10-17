"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackAnalytics } from "@/lib/analytics";
import {
  ArrowRight,
  BedDouble,
  Building2,
  MapPin,
  Search,
  Tag,
} from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";
import {
  type Availability,
  type Category,
  type Intent,
  bedroomsHidden,
  buildPropertiesHref,
  typesFor,
} from "@/lib/property-taxonomy";

const LOCATIONS = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "London",
  "Cardiff",
  "Manchester",
  "Birmingham",
  "Bali, Indonesia",
];

const BEDROOMS = [
  { value: "0", label: "Studio" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

/** One simple choice instead of three toggles: Buy · Rent · Off-plan. */
type Mode = "buy" | "rent" | "off-plan";
const MODES: { id: Mode; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "off-plan", label: "Off-plan" },
];

export function HomepagePropertySearch() {
  const router = useRouter();
  const { openSeller } = useLeadModals();
  const [category, setCategory] = useState<Category>("residential");
  const [mode, setMode] = useState<Mode>("buy");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [beds, setBeds] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const availability: Availability = mode === "off-plan" ? "off-plan" : "ready";
  const intent: Intent = mode === "rent" ? "rent" : "sale";
  const typeOptions = typesFor(category, availability);
  const hideBeds = bedroomsHidden(category, type);

  function changeCategory(next: Category) {
    setCategory(next);
    setType("");
  }

  function changeMode(next: Mode) {
    setMode(next);
    setType("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    trackAnalytics("haus_property_search", {
      category,
      availability,
      intent,
    });

    setSubmitted(true);
    router.push(
      buildPropertiesHref({
        category,
        availability,
        intent,
        type: type || undefined,
        location: location || undefined,
        beds: hideBeds ? undefined : beds || undefined,
      }),
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-4xl md:mt-12">
      {submitted ? (
        <div
          role="status"
          aria-live="polite"
          className="glass mx-auto max-w-xl rounded-[1.75rem] p-6 text-center shadow-e3"
        >
          <p className="font-serif text-xl font-medium text-estate-700">
            Finding properties for your search…
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your search results will open shortly.
          </p>
        </div>
      ) : (
        <>
          <SegmentedControl
            ariaLabel="Buy, rent or off-plan"
            options={MODES}
            value={mode}
            onChange={(value) => changeMode(value as Mode)}
          />

          <form
            onSubmit={handleSubmit}
            noValidate
            className="glass mt-4 rounded-[1.75rem] bg-white/92 p-2 shadow-e3 md:rounded-full"
          >
            <div
              className={`grid gap-1 md:items-center ${
                hideBeds
                  ? "md:grid-cols-[1fr_1fr_auto]"
                  : "md:grid-cols-[1fr_1fr_0.8fr_auto]"
              }`}
            >
              <Field icon={MapPin} label="Where">
                <select
                  aria-label="Preferred location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="w-full bg-transparent text-[0.9375rem] font-medium text-foreground outline-none"
                >
                  <option value="">Anywhere</option>
                  {LOCATIONS.map((locationOption) => (
                    <option key={locationOption} value={locationOption}>
                      {locationOption}
                    </option>
                  ))}
                </select>
              </Field>

              <Field icon={Building2} label="Property" bordered>
                <select
                  aria-label="Property type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full bg-transparent text-[0.9375rem] font-medium text-foreground outline-none"
                >
                  <option value="">Any type</option>
                  {typeOptions.map((typeOption) => (
                    <option key={typeOption} value={typeOption}>
                      {typeOption}
                    </option>
                  ))}
                </select>
              </Field>

              {!hideBeds && (
                <Field icon={BedDouble} label="Bedrooms" bordered>
                  <select
                    aria-label="Bedrooms"
                    value={beds}
                    onChange={(event) => setBeds(event.target.value)}
                    className="w-full bg-transparent text-[0.9375rem] font-medium text-foreground outline-none"
                  >
                    <option value="">Any</option>
                    {BEDROOMS.map((bedroom) => (
                      <option key={bedroom.value} value={bedroom.value}>
                        {bedroom.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full md:w-auto"
              >
                <Search className="h-4 w-4" />
                {loading ? "Searching…" : "Search"}
              </Button>
            </div>
          </form>

          <p className="mt-4 text-sm text-white/70">
            {category === "residential" ? (
              <>
                Looking for commercial space?{" "}
                <button
                  type="button"
                  onClick={() => changeCategory("commercial")}
                  className="font-medium text-white underline underline-offset-4 hover:text-gold-300"
                >
                  Switch to commercial
                </button>
              </>
            ) : (
              <>
                Searching commercial.{" "}
                <button
                  type="button"
                  onClick={() => changeCategory("residential")}
                  className="font-medium text-white underline underline-offset-4 hover:text-gold-300"
                >
                  Back to residential
                </button>
              </>
            )}
          </p>
        </>
      )}

      <p className="mt-2 text-sm text-white/70">
        Selling your home?{" "}
        <button
          type="button"
          onClick={openSeller}
          className="inline-flex items-center gap-1 font-medium text-gold-300 underline-offset-4 hover:underline"
        >
          <Tag className="h-3.5 w-3.5" />
          Get a free valuation
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </p>
    </div>
  );
}

function SegmentedControl({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="glass-dark mx-auto inline-flex rounded-full p-1"
    >
      {options.map((option) => {
        const selected = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={`min-h-10 rounded-full px-5 text-[0.9375rem] font-medium transition-[background-color,color,box-shadow] duration-200 ease-out-expo ${
              selected
                ? "bg-white text-estate-700 shadow-e1"
                : "text-white/85 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  bordered,
  children,
}: {
  icon: React.ElementType;
  label: string;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2 text-left transition-colors hover:bg-white/60 md:px-6 ${
        bordered ? "md:border-l md:border-hairline md:rounded-none" : ""
      }`}
    >
      <Icon className="h-[1.125rem] w-[1.125rem] shrink-0 text-estate-700" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        {children}
      </span>
    </label>
  );
}
