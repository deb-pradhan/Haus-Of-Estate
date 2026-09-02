"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Globe2,
  Building2,
  BedDouble,
  Search,
  Tag,
} from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";
import {
  type Category,
  type Availability,
  type Intent,
  CATEGORIES,
  CATEGORY_LABELS,
  AVAILABILITIES,
  AVAILABILITY_LABELS,
  typesFor,
  bedroomsHidden,
  buildPropertiesHref,
} from "@/lib/property-taxonomy";

const COUNTRIES = [
  "United Kingdom",
  "United Arab Emirates",
  "Indonesia",
  "Cyprus",
];

const BEDROOMS = [
  { value: "0", label: "Studio" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

const STATS = [
  { value: "1,200+", label: "Clients matched since 2022" },
  { value: "15+", label: "Years' experience" },
  { value: "3", label: "Continents" },
  { value: "4.8★", label: "Average rating" },
];

// Buyer-facing labels for the intent control.
const INTENT_TABS: { id: Intent; label: string }[] = [
  { id: "sale", label: "Buy" },
  { id: "rent", label: "Rent" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function BuyRentSell() {
  const router = useRouter();
  const { openSeller } = useLeadModals();
  const [category, setCategory] = useState<Category>("residential");
  const [availability, setAvailability] = useState<Availability>("ready");
  const [intent, setIntent] = useState<Intent>("sale");
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const [beds, setBeds] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const greeting = getGreeting();

  const offPlan = availability === "off-plan";
  const effectiveIntent: Intent = offPlan ? "sale" : intent;
  const typeOptions = typesFor(category, availability);
  const hideBeds = bedroomsHidden(category, type);

  function changeCategory(next: Category) {
    setCategory(next);
    setType(""); // reset type when scope changes
  }

  function changeAvailability(next: Availability) {
    setAvailability(next);
    setType(""); // reset type when scope changes
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    // Fire GA4 event on submission.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "lead_form_submit",
      form_location: "homepage_hero",
      category,
      availability,
      intent: effectiveIntent,
      property_type: type || null,
      selected_country: country || null,
      // Preserve the existing GTM field while Tanu migrates the mapping.
      selected_location: country || null,
      bedrooms: hideBeds ? null : beds || null,
    });

    const href = buildPropertiesHref({
      category,
      availability,
      intent: effectiveIntent,
      type: type || undefined,
      location: country || undefined,
      beds: hideBeds ? undefined : beds || undefined,
    });

    setSubmitted(true);
    router.push(href);
  };

  return (
    <section aria-label="Hero" className="relative overflow-hidden bg-estate-700">
      {/* Subtle brand texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #c4a87a 0, transparent 45%), radial-gradient(circle at 85% 80%, #c4a87a 0, transparent 40%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center md:px-6 md:py-28">
        <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
          UK · UAE · International
        </p>

        <p className="mx-auto mt-5 text-sm text-white/70 md:text-base">
          {greeting} — welcome to Haus of Estate.
        </p>

        <h1 className="mx-auto mt-3 max-w-3xl font-serif text-[2.75rem] font-medium leading-[1.06] text-white md:text-[4rem] md:leading-[1.04]">
          Property in Dubai, the UK &amp; beyond — <span className="text-gold-400">with proof.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
          One enquiry connects you to the right vetted agent — transparent
          advice, no hidden fees, wherever you&apos;re moving capital.
        </p>

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
            {/* Taxonomy segmented controls */}
            <div className="mx-auto mt-9 flex flex-wrap items-center justify-center gap-2">
              <SegmentedControl
                ariaLabel="Category"
                options={CATEGORIES.map((c) => ({
                  id: c,
                  label: CATEGORY_LABELS[c],
                }))}
                value={category}
                onChange={(v) => changeCategory(v as Category)}
              />
              <SegmentedControl
                ariaLabel="Availability"
                options={AVAILABILITIES.map((a) => ({
                  id: a,
                  label: AVAILABILITY_LABELS[a],
                }))}
                value={availability}
                onChange={(v) => changeAvailability(v as Availability)}
              />
              <SegmentedControl
                ariaLabel="Buy or rent"
                options={INTENT_TABS.map((t) => ({
                  id: t.id,
                  label: t.label,
                  disabled: offPlan && t.id === "rent",
                  title:
                    offPlan && t.id === "rent"
                      ? "Off-plan is sale only"
                      : undefined,
                }))}
                value={effectiveIntent}
                onChange={(v) => setIntent(v as Intent)}
              />
            </div>

            {/* Search bar */}
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
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                  >
                    <option value="">Any type</option>
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field icon={Globe2} label="Country" bordered>
                  <select
                    aria-label="Country of interest"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                  >
                    <option value="">Any country</option>
                    {COUNTRIES.map((countryOption) => (
                      <option key={countryOption} value={countryOption}>
                        {countryOption}
                      </option>
                    ))}
                  </select>
                </Field>

                {!hideBeds && (
                  <Field icon={BedDouble} label="Bedrooms" bordered>
                    <select
                      aria-label="Bedrooms"
                      value={beds}
                      onChange={(e) => setBeds(e.target.value)}
                      className="w-full bg-transparent text-sm text-foreground outline-none"
                    >
                      <option value="">Any</option>
                      {BEDROOMS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
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

        {/* Selling path — not a search; a separate flow */}
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

        {/* Stat strip */}
        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="font-serif text-3xl font-medium text-gold-400 md:text-4xl">
                {s.value}
              </dt>
              <dd className="mt-1 text-xs uppercase tracking-[0.15em] text-white/60">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
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
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={selected}
            disabled={opt.disabled}
            title={opt.title}
            onClick={() => !opt.disabled && onChange(opt.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected
                ? "bg-white text-estate-700 shadow-sm"
                : opt.disabled
                  ? "cursor-not-allowed text-white/35"
                  : "text-white/80 hover:text-white"
            }`}
          >
            {opt.label}
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
