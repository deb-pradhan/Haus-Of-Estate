"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  KeyRound,
  ArrowRight,
  MapPin,
  Building2,
  BedDouble,
  Search,
  Tag,
} from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

// ── Filter option sets — aligned to the actual property schema ──────────

type Intent = "buy" | "rent";

const TABS: { id: Intent; label: string; icon: React.ElementType }[] = [
  { id: "buy", label: "Buy", icon: Home },
  { id: "rent", label: "Rent", icon: KeyRound },
];

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

// Friendly groupings — these map to one or more schema unitType values
// when /properties filters its results. See TYPE_GROUPS in /properties.
const TYPES = [
  "Apartment",
  "Villa",
  "Mansion",
  "Penthouse",
  "Townhouse",
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
  { value: "1,200+", label: "Clients matched" },
  { value: "15+", label: "Years' experience" },
  { value: "3", label: "Continents" },
  { value: "4.8★", label: "Average rating" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function BuyRentSell() {
  const router = useRouter();
  const { openSeller } = useLeadModals();
  const [intent, setIntent] = useState<Intent>("buy");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [beds, setBeds] = useState("");
  const greeting = getGreeting();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("intent", intent);
    if (location) params.set("location", location);
    if (type) params.set("type", type);
    if (beds) params.set("beds", beds);
    router.push(`/properties?${params.toString()}`);
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

        <h1 className="mx-auto mt-6 max-w-3xl font-serif text-[2.75rem] font-medium leading-[1.06] text-white md:text-[4rem] md:leading-[1.04]">
          {greeting}. Property, <span className="text-gold-400">with proof.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
          One enquiry connects you to the right vetted agent — transparent
          advice, no hidden fees, wherever you&apos;re moving capital.
        </p>

        {/* Buy / Rent intent toggle */}
        <div
          role="tablist"
          aria-label="What would you like to do"
          className="mx-auto mt-9 inline-flex rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur-sm"
        >
          {TABS.map((t) => {
            const selected = t.id === intent;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setIntent(t.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-white text-estate-700 shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <t.icon className="h-4 w-4" strokeWidth={1.75} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-5 max-w-4xl rounded-2xl border border-white/15 bg-surface p-2 shadow-2xl shadow-black/25 md:rounded-full"
        >
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
            <Field icon={MapPin} label="Location">
              <select
                aria-label="Preferred location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none"
              >
                <option value="">Anywhere</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>

            <Field icon={Building2} label="Property type" bordered>
              <select
                aria-label="Property type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none"
              >
                <option value="">Any type</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

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

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-estate-700 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-estate-600 md:rounded-full"
            >
              <Search className="h-4 w-4" />
              Find my match
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-white/55">
          Free &amp; without obligation · Replied to within 2 working hours
        </p>

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
