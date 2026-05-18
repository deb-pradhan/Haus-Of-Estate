"use client";

import { useState } from "react";
import { Home, KeyRound, Tag, ArrowRight, MapPin, Building2, Wallet, Search } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

const TABS = [
  { id: "buy", label: "Buy", icon: Home, action: "buyer" as const },
  { id: "rent", label: "Rent", icon: KeyRound, action: "buyer" as const },
  { id: "sell", label: "Sell", icon: Tag, action: "seller" as const },
];

const LOCATIONS = [
  "London",
  "Cardiff",
  "Manchester",
  "Birmingham",
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Bali, Indonesia",
  "Other / Not sure",
];

const TYPES = ["Apartment", "Villa", "Townhouse", "Penthouse", "Commercial", "Land / Plot"];

const BUDGETS = [
  "Up to £250k",
  "£250k – £500k",
  "£500k – £1m",
  "£1m – £2.5m",
  "£2.5m+",
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
  const { openBuyer, openSeller } = useLeadModals();
  const [activeTab, setActiveTab] = useState("buy");
  const greeting = getGreeting();

  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const startEnquiry = () => (tab.action === "seller" ? openSeller() : openBuyer());

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

        {/* Buy / Rent / Sell quick-tabs */}
        <div
          role="tablist"
          aria-label="What would you like to do"
          className="mx-auto mt-9 inline-flex rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur-sm"
        >
          {TABS.map((t) => {
            const selected = t.id === activeTab;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(t.id)}
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

        {/* Enquiry search bar */}
        <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-white/15 bg-surface p-2 shadow-2xl shadow-black/25 md:rounded-full">
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
            <Field icon={MapPin} label="Location">
              <select
                aria-label="Preferred location"
                defaultValue=""
                className="w-full bg-transparent text-sm text-foreground outline-none"
              >
                <option value="" disabled>
                  Any location
                </option>
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
                defaultValue=""
                className="w-full bg-transparent text-sm text-foreground outline-none"
              >
                <option value="" disabled>
                  Any type
                </option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field icon={Wallet} label="Budget" bordered>
              <select
                aria-label="Budget"
                defaultValue=""
                className="w-full bg-transparent text-sm text-foreground outline-none"
              >
                <option value="" disabled>
                  Any budget
                </option>
                {BUDGETS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <button
              type="button"
              onClick={startEnquiry}
              className="flex items-center justify-center gap-2 rounded-xl bg-estate-700 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-estate-600 md:rounded-full"
            >
              <Search className="h-4 w-4" />
              {tab.id === "sell" ? "Get appraisal" : "Find my match"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-white/55">
          Free &amp; without obligation · Replied to within 2 working hours
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
