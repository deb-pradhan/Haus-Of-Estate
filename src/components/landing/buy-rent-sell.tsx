"use client";

import { Home, KeyRound, Tag, ArrowRight } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

const CARDS = [
  {
    id: "buy",
    label: "Buy",
    title: "Buy a property",
    desc: "Tell us your brief and we'll match you with vetted estate agents across the UK, UAE and beyond.",
    icon: Home,
    action: "buyer" as const,
  },
  {
    id: "rent",
    label: "Rent",
    title: "Rent a property",
    desc: "Looking to let a home? We'll introduce you to trusted letting agents in your chosen areas.",
    icon: KeyRound,
    action: "buyer" as const,
  },
  {
    id: "sell",
    label: "Sell",
    title: "Sell or let your property",
    desc: "Get a free, no-obligation market appraisal and connect with agents who deliver results.",
    icon: Tag,
    action: "seller" as const,
  },
];

export function BuyRentSell() {
  const { openBuyer, openSeller } = useLeadModals();

  return (
    <section className="px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            How can we help
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Buy, rent or sell — start here.
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            One enquiry. The right agent. No hidden fees.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CARDS.map((card) => {
            const onClick = card.action === "seller" ? openSeller : openBuyer;
            return (
              <button
                key={card.id}
                type="button"
                onClick={onClick}
                className="group flex flex-col items-start rounded-2xl border border-border bg-surface p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-estate-700/40 hover:shadow-xl hover:shadow-estate-700/5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-estate-700/10 text-estate-700 transition-colors group-hover:bg-estate-700 group-hover:text-white">
                  <card.icon className="h-6 w-6" />
                </span>
                <span className="mt-4 font-serif text-xs font-semibold uppercase tracking-widest text-gold-500">
                  {card.label}
                </span>
                <h3 className="mt-1 font-serif text-xl font-medium text-estate-700">
                  {card.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {card.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-estate-700">
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
