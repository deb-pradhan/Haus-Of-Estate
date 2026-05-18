"use client";

import Image from "next/image";
import { Home, KeyRound, Tag, ArrowRight, Check, Shield, ChevronDown } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85";

const ROWS = [
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function BuyRentSell() {
  const { openBuyer, openSeller } = useLeadModals();
  const greeting = getGreeting();

  return (
    <section
      className="relative min-h-[88vh] overflow-hidden bg-estate-700"
      aria-label="Hero"
    >
      {/* Full-bleed background */}
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Luxury property"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
        {/* Left: messaging */}
        <div>
          <p className="mb-3 font-serif text-sm font-medium uppercase tracking-widest text-gold-400 opacity-90">
            UK · UAE · International
          </p>
          <h1 className="max-w-xl font-serif text-4xl font-medium leading-tight text-white md:text-5xl md:leading-[1.08]">
            {greeting} —{" "}
            <span className="text-gold-400">your global property journey</span>{" "}
            starts here.
          </h1>
          <p className="mt-4 max-w-md text-base text-white/80 md:text-lg">
            One enquiry. The right agent. No hidden fees.
          </p>

          <ul className="mt-5 flex flex-col gap-2 text-sm text-white/80 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 md:text-base">
            {["Vetted estate agents.", "Transparent advice.", "No hidden fees."].map(
              (t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                  <span>{t}</span>
                </li>
              ),
            )}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {["RERA", "FCA-Regulated", "Google 4.8", "TrustPilot"].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60 backdrop-blur-sm"
              >
                <Shield className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: tabular Buy / Rent / Sell view */}
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/95 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-border bg-surface px-6 py-4">
            <p className="font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
              How can we help
            </p>
            <h2 className="mt-0.5 font-serif text-xl font-medium text-estate-700">
              Buy, rent or sell — start here.
            </h2>
          </div>

          <table className="w-full text-left">
            <tbody>
              {ROWS.map((row) => {
                const onClick =
                  row.action === "seller" ? openSeller : openBuyer;
                return (
                  <tr
                    key={row.id}
                    onClick={onClick}
                    className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-estate-700/5"
                  >
                    <td className="py-4 pl-6 pr-3 align-top">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-estate-700/10 text-estate-700 transition-colors group-hover:bg-estate-700 group-hover:text-white">
                        <row.icon className="h-5 w-5" />
                      </span>
                    </td>
                    <td className="py-4 pr-3 align-top">
                      <span className="block font-serif text-[11px] font-semibold uppercase tracking-widest text-gold-500">
                        {row.label}
                      </span>
                      <span className="mt-0.5 block font-serif text-base font-medium text-estate-700">
                        {row.title}
                      </span>
                      <span className="mt-1 block max-w-xs text-xs leading-relaxed text-muted-foreground">
                        {row.desc}
                      </span>
                    </td>
                    <td className="py-4 pl-3 pr-6 align-middle text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClick();
                        }}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-estate-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-estate-600"
                        aria-label={`${row.title} — get started`}
                      >
                        Get started
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() =>
          document
            .getElementById("services")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-bounce-gentle text-white/40"
        aria-label="Scroll down"
      >
        <ChevronDown className="h-6 w-6" />
      </button>
    </section>
  );
}
