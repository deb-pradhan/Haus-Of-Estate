"use client";

import { Home, KeyRound, Tag, ArrowRight } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

const ROWS = [
  {
    id: "buy",
    label: "Buy",
    title: "Buy a property",
    desc: "Tell us your brief — we match you with vetted estate agents across the UK, UAE and beyond.",
    icon: Home,
    action: "buyer" as const,
  },
  {
    id: "rent",
    label: "Rent",
    title: "Rent a property",
    desc: "Looking to let a home? We introduce you to trusted letting agents in your chosen areas.",
    icon: KeyRound,
    action: "buyer" as const,
  },
  {
    id: "sell",
    label: "Sell",
    title: "Sell or let your property",
    desc: "A free, no-obligation market appraisal and agents who deliver results.",
    icon: Tag,
    action: "seller" as const,
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const TRUST = ["RERA", "FCA-Regulated", "Rated 4.8 on Google", "Trustpilot"];

export function BuyRentSell() {
  const { openBuyer, openSeller } = useLeadModals();
  const greeting = getGreeting();

  return (
    <section
      aria-label="Hero"
      className="border-b border-estate-600/40 bg-estate-700"
    >
      <div className="mx-auto grid max-w-7xl gap-x-16 gap-y-12 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        {/* Left — editorial statement */}
        <div>
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            UK · UAE · International
          </p>

          <h1 className="mt-6 font-serif text-[2.75rem] font-medium leading-[1.05] text-white md:text-6xl md:leading-[1.04]">
            {greeting}.
            <span className="mt-2 block text-white/95">
              Property, <span className="text-gold-400">with proof.</span>
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75 md:text-lg">
            One enquiry connects you to the right vetted agent. Transparent
            advice, no hidden fees — wherever you&apos;re moving capital.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/65">
            {TRUST.map((t, i) => (
              <span key={t} className="flex items-center gap-3">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-gold-400/60" />}
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right — functional tabular flow */}
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-surface shadow-2xl shadow-black/20">
          <div className="flex items-baseline justify-between border-b border-border px-6 py-4">
            <h2 className="font-serif text-lg font-medium text-estate-700">
              Buy, rent or sell
            </h2>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Start here
            </span>
          </div>

          <ul role="list" className="divide-y divide-border">
            {ROWS.map((row) => {
              const onClick =
                row.action === "seller" ? openSeller : openBuyer;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={onClick}
                    aria-label={`${row.title} — start enquiry`}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-5 text-left outline-none transition-colors hover:bg-estate-700/[0.04] focus-visible:bg-estate-700/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-estate-700/40"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-estate-700/8 text-estate-700 transition-colors duration-200 group-hover:bg-estate-700 group-hover:text-white">
                      <row.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>

                    <span className="min-w-0">
                      <span className="block font-serif text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-500">
                        {row.label}
                      </span>
                      <span className="mt-0.5 block font-serif text-lg font-medium leading-tight text-estate-700">
                        {row.title}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {row.desc}
                      </span>
                    </span>

                    <span
                      aria-hidden
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-estate-700 transition-all duration-200 group-hover:border-estate-700 group-hover:bg-estate-700 group-hover:text-white"
                    >
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="border-t border-border px-6 py-3.5 text-center text-[11px] text-muted-foreground">
            Free &amp; without obligation · Replied to within 2 working hours
          </p>
        </div>
      </div>
    </section>
  );
}
