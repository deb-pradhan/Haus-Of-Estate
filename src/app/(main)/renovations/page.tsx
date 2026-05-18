"use client";

import {
  ArrowRight,
  PaintRoller,
  Wrench,
  Sofa,
  Zap,
  LayoutGrid,
  ShieldCheck,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "@/components/lead-modal/modal-context";

const SERVICES = [
  {
    icon: PaintRoller,
    title: "Painting",
    body: "Interior and exterior painting with a clean, professional finish. Prep, primer and protection included as standard.",
  },
  {
    icon: Wrench,
    title: "Plumbing",
    body: "From leaks and bathroom upgrades to full re-pipes — Gas Safe partners and certified plumbers across our network.",
  },
  {
    icon: Sofa,
    title: "Decorating",
    body: "Plastering, wallpapering, coving and finishing touches that get a property tenant- or sale-ready.",
  },
  {
    icon: Zap,
    title: "Electrical Wiring & Installation",
    body: "Full or partial rewires, consumer units, lighting and EICR-compliant installations by certified electricians.",
  },
  {
    icon: LayoutGrid,
    title: "Carpet & Flooring",
    body: "Carpet, laminate, LVT and hardwood — supplied and fitted, with subfloor preparation handled end to end.",
  },
];

const ASSURANCES = [
  { icon: ShieldCheck, label: "Vetted & insured tradespeople" },
  { icon: BadgeCheck, label: "Rent Smart Wales & Propertymark CMP Registered" },
  { icon: Clock, label: "Clear timelines, no hidden fees" },
];

export default function RenovationsPage() {
  const { openAccount } = useLeadModals();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-surface px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
            Renovations
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-estate-700 md:text-5xl">
            Property improvements, handled properly.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Preparing a property to let, sell or simply enjoy? We connect you with vetted
            trades across painting, plumbing, decorating, electrical and flooring — managed
            to the same standard as the rest of our service.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={openAccount}
              className="bg-estate-700 text-white hover:bg-estate-600"
            >
              Request a quote <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              What we cover
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              Five core trades. One point of contact.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="flex flex-col items-start rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-estate-700/40 hover:shadow-xl hover:shadow-estate-700/5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-estate-700/10 text-estate-700">
                  <service.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-serif text-xl font-medium text-estate-700">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.body}
                </p>
              </div>
            ))}

            {/* CTA card */}
            <div className="flex flex-col items-start justify-center rounded-2xl border-2 border-dashed border-estate-700/30 bg-estate-700/5 p-6">
              <h3 className="font-serif text-xl font-medium text-estate-700">
                Something else?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Tell us about your project and we&apos;ll match you with the right trade.
              </p>
              <Button
                onClick={openAccount}
                className="mt-4 bg-estate-700 text-white hover:bg-estate-600"
              >
                Speak to us <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Assurances */}
      <section className="bg-subtle px-4 py-14 md:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 text-center sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-3">
          {ASSURANCES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <Icon className="h-5 w-5 text-estate-700" />
              {label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
