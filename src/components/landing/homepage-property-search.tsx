"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  AVAILABILITIES,
  AVAILABILITY_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
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

const INTENT_TABS: { id: Intent; label: string }[] = [
  { id: "sale", label: "Buy" },
  { id: "rent", label: "Rent" },
];

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function HomepagePropertySearch() {
  const router = useRouter();
  const { openSeller } = useLeadModals();
  const [category, setCategory] = useState<Category>("residential");
  const [availability, setAvailability] = useState<Availability>("ready");
  const [intent, setIntent] = useState<Intent>("sale");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [beds, setBeds] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const offPlan = availability === "off-plan";
  const effectiveIntent: Intent = offPlan ? "sale" : intent;
  const typeOptions = typesFor(category, availability);
  const hideBeds = bedroomsHidden(category, type);

  function changeCategory(next: Category) {
    setCategory(next);
    setType("");
  }

  function changeAvailability(next: Availability) {
    setAvailability(next);
    setType("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "lead_form_submit",
      form_location: "homepage_hero",
      category,
      availability,
      intent: effectiveIntent,
      property_type: type || null,
      selected_location: location || null,
      bedrooms: hideBeds ? null : beds || null,
    });

    setSubmitted(true);
    router.push(
      buildPropertiesHref({
        category,
        availability,
        intent: effectiveIntent,
        type: type || undefined,
        location: location || undefined,
        beds: hideBeds ? undefined : beds || undefined,
      }),
    );
  }

  return (
    <>
      {submitted ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto mt-9 max-w-xl rounded-2xl border border-white/15 bg-surface p-6 text-center shadow-2xl shadow-black/25"
        >
          <p className="font-serif text-lg font-medium text-estate-700">
            Thank you — we&apos;ll reply within 2 hours.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re matching you with a vetted agent for your search now.
          </p>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-9 flex flex-wrap items-center justify-center gap-2">
            <SegmentedControl
              ariaLabel="Category"
              options={CATEGORIES.map((categoryOption) => ({
                id: categoryOption,
                label: CATEGORY_LABELS[categoryOption],
              }))}
              value={category}
              onChange={(value) => changeCategory(value as Category)}
            />
            <SegmentedControl
              ariaLabel="Availability"
              options={AVAILABILITIES.map((availabilityOption) => ({
                id: availabilityOption,
                label: AVAILABILITY_LABELS[availabilityOption],
              }))}
              value={availability}
              onChange={(value) =>
                changeAvailability(value as Availability)
              }
            />
            <SegmentedControl
              ariaLabel="Buy or rent"
              options={INTENT_TABS.map((intentOption) => ({
                id: intentOption.id,
                label: intentOption.label,
                disabled: offPlan && intentOption.id === "rent",
                title:
                  offPlan && intentOption.id === "rent"
                    ? "Off-plan is sale only"
                    : undefined,
              }))}
              value={effectiveIntent}
              onChange={(value) => setIntent(value as Intent)}
            />
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto mt-5 max-w-4xl rounded-2xl border border-white/15 bg-surface p-2 shadow-2xl shadow-black/25 md:rounded-full"
          >
            <div
              className={`grid gap-2 md:items-center ${
                hideBeds
                  ? "md:grid-cols-[1fr_1fr_auto]"
                  : "md:grid-cols-[1fr_1fr_1fr_auto]"
              }`}
            >
              <Field icon={Building2} label="Property type">
                <select
                  aria-label="Property type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="">Any type</option>
                  {typeOptions.map((typeOption) => (
                    <option key={typeOption} value={typeOption}>
                      {typeOption}
                    </option>
                  ))}
                </select>
              </Field>

              <Field icon={MapPin} label="Location" bordered>
                <select
                  aria-label="Preferred location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="">Any location</option>
                  {LOCATIONS.map((locationOption) => (
                    <option key={locationOption} value={locationOption}>
                      {locationOption}
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
                    className="w-full bg-transparent text-sm text-foreground outline-none"
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

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-estate-700 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-estate-600 disabled:cursor-not-allowed disabled:opacity-70 md:rounded-full"
              >
                <Search className="h-4 w-4" />
                {loading ? "Finding your match…" : "Find my match"}
              </button>
            </div>
          </form>
        </>
      )}

      {!submitted && (
        <p className="mt-4 text-xs text-white/55">
          Free &amp; without obligation · Replied to within 2 working hours
        </p>
      )}

      <p className="mt-3 text-sm text-white/65">
        Selling your home?{" "}
        <button
          type="button"
          onClick={openSeller}
          className="inline-flex items-center gap-1 font-semibold text-gold-400 underline-offset-4 hover:underline"
        >
          <Tag className="h-3.5 w-3.5" />
          Get a free valuation
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </p>
    </>
  );
}

function SegmentedControl({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: { id: string; label: string; disabled?: boolean; title?: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur-sm"
    >
      {options.map((option) => {
        const selected = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            title={option.title}
            onClick={() => !option.disabled && onChange(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected
                ? "bg-white text-estate-700 shadow-sm"
                : option.disabled
                  ? "cursor-not-allowed text-white/35"
                  : "text-white/80 hover:text-white"
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
      className={`flex items-center gap-3 px-4 py-2.5 text-left md:px-5 ${
        bordered ? "md:border-l md:border-border" : ""
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-estate-700" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        {children}
      </span>
    </label>
  );
}
