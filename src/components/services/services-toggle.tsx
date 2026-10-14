"use client";

import { BadgeCheck, Calendar, Clock, Home, Key, Tag } from "lucide-react";
import { LeadEoiTrigger } from "@/components/lead-eoi/lead-eoi-trigger";

type Intent = "buy" | "rent" | "sell" | "list";

function TrustBadges() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
      {[
        { icon: BadgeCheck, text: "15+ Years Experience" },
        { icon: Clock, text: "24/7 Support" },
      ].map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="h-4 w-4 text-estate-700" />
          {text}
        </div>
      ))}
    </div>
  );
}

// ─── Intent Selector ──────────────────────────────────────────────────────────

function IntentSelector() {
  const intents = [
    {
      id: "buy" as Intent,
      icon: Home,
      title: "Looking to Buy",
      desc: "Find your perfect property investment",
      color: "estate-700",
      badge: "Most popular",
    },
    {
      id: "rent" as Intent,
      icon: Key,
      title: "Looking to Rent",
      desc: "Rent your next home or commercial space",
      color: "trust-teal",
    },
    {
      id: "sell" as Intent,
      icon: Tag,
      title: "Looking to Sell",
      desc: "Get the best price for your property",
      color: "action-amber",
    },
    {
      id: "list" as Intent,
      icon: Calendar,
      title: "Looking to Let",
      desc: "Match with a vetted letting agent",
      color: "copper-clay",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 text-center">
        <p className="mb-1 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
          What we offer
        </p>
        <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
          How can we help you today?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your goal and we&apos;ll guide you through the rest — takes less than 2 minutes.
        </p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-estate-700 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-estate-700" />
          </span>
          Join 1,200+ people we&apos;ve matched with vetted agents since 2022
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {intents.map((item) => (
          <LeadEoiTrigger
            key={item.id}
            options={{ interest: item.id === "buy" ? "buy" : item.id === "rent" ? "rent" : "sell_let", surface: "manual_cta" }}
            fallbackHref="/enquire"
            className="group flex flex-col gap-3 rounded-2xl border-2 border-border bg-surface p-5 text-left transition-all duration-300 hover:border-estate-700/40 hover:shadow-md hover:shadow-estate-700/5"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{
                backgroundColor:
                  item.id === "buy"
                    ? "rgba(31, 79, 47, 0.1)"
                    : item.id === "rent"
                    ? "rgba(47, 122, 115, 0.1)"
                    : item.id === "sell"
                    ? "rgba(193, 138, 45, 0.1)"
                    : "rgba(176, 125, 99, 0.1)",
              }}
            >
              <item.icon
                className="h-5 w-5"
                style={{
                  color:
                    item.id === "buy"
                      ? "#1f4f2f"
                      : item.id === "rent"
                      ? "#2f7a73"
                      : item.id === "sell"
                      ? "#c18a2d"
                      : "#b07d63",
                }}
              />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="font-serif text-sm font-semibold text-estate-700 leading-tight">{item.title}</p>
                {item.badge && (
                  <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-xs font-semibold text-gold-600">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </LeadEoiTrigger>
        ))}
      </div>

      <TrustBadges />
    </div>
  );
}

export function ServicesToggle() {
  return (
    <section id="services" className="bg-subtle px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <IntentSelector />
      </div>
    </section>
  );
}
