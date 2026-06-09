"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Sparkles,
  Sofa,
  PaintRoller,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "@/components/lead-modal/modal-context";

interface ServiceSection {
  id: string;
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  lead: string;
  body: string;
  bullets: string[];
  cta: { label: string; action?: "buyer" | "seller" | "account"; href?: string };
}

const SECTIONS: ServiceSection[] = [
  {
    id: "property-management",
    eyebrow: "Property Management",
    title: "Property Management",
    icon: ClipboardList,
    lead: "Tenancies, maintenance and compliance — handled properly, with you in the loop.",
    body:
      "For landlords with one property or a portfolio. We coordinate everyday management — referencing, check-ins and check-outs, maintenance, inspections, statutory compliance and arrears — and report clearly on what’s happening across your homes.",
    bullets: [
      "Tenancy administration end to end",
      "Gas Safe, EICR, EPC and Right to Rent kept current",
      "Maintenance triaged and contractors managed",
      "Transparent monthly reporting",
    ],
    cta: { label: "Speak to a property manager", action: "account" },
  },
  {
    id: "staging",
    eyebrow: "Property Staging",
    title: "Staging",
    icon: Sparkles,
    lead: "Present a home at its best for viewings, photography and marketing.",
    body:
      "Staging is where styling meets logistics. We prepare a property so prospective buyers and tenants can picture themselves living there — quickly, on schedule, and ready for the marketing campaign. Suitable for vacant homes and lived-in ones being prepared for sale.",
    bullets: [
      "Concept, source, install and de-rig",
      "Furniture, soft furnishings and accessories",
      "Photography and viewing-day attendance",
    ],
    cta: { label: "Enquire about staging", action: "account" },
  },
  {
    id: "furnishing",
    eyebrow: "Furnishing & Interiors",
    title: "Furnishing",
    icon: Sofa,
    lead: "Move-in ready interiors for new builds and let properties.",
    body:
      "From a one-bedroom apartment fit-out to a full villa furnishing package, we plan to a brief and a budget. We specify the right pieces, manage delivery and installation, and hand back a finished home ready for occupation, marketing or photography.",
    bullets: [
      "Tailored to brief: lettings spec, owner-occupied or showhome",
      "Procurement and supplier management",
      "Delivery, install and snagging",
    ],
    cta: { label: "Enquire about furnishing", action: "account" },
  },
  {
    id: "renovations",
    eyebrow: "Renovations",
    title: "Renovations",
    icon: PaintRoller,
    lead: "Vetted trades for painting, plumbing, decorating, electrical and flooring.",
    body:
      "Whether you’re preparing a home to let or sell, or settling into a new one, we connect you to trusted trades and manage scope, scheduling and snagging. Single trades or a coordinated package — your choice.",
    bullets: [
      "Painting and decorating",
      "Plumbing and bathroom upgrades",
      "Electrical, lighting and EICR-compliant installs",
      "Carpet, laminate, LVT and hardwood flooring",
    ],
    cta: { label: "See our Renovations page", href: "/renovations" },
  },
];

const SUB_NAV = SECTIONS.map((s) => ({ id: s.id, title: s.title }));

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            Services
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] text-white md:text-6xl md:leading-[1.04]">
            Beyond the deal —{" "}
            <span className="text-gold-400">the services that make a home work.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Management, staging, furnishing and renovations — the specialist
            services we offer alongside our buy, rent and sell advisory, with
            vetted partners in every market we serve.
          </p>
        </div>
      </section>

      {/* Sticky sub-nav */}
      <nav
        aria-label="Services sections"
        className="sticky top-16 z-30 border-b border-border bg-surface/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 md:px-6">
          {SUB_NAV.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap px-3 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-estate-700"
            >
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* Sections */}
      <div className="bg-background">
        {SECTIONS.map((s, idx) => (
          <ServiceBlock key={s.id} section={s} alternate={idx % 2 === 1} />
        ))}
      </div>

      {/* Closing CTA */}
      <section className="bg-estate-700 px-4 py-16 text-white md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-medium md:text-4xl">
            Not sure which one?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/80">
            Send a short enquiry and an advisor will reply within two working
            hours with the right next step for your situation.
          </p>
          <SpeakToAdvisor />
        </div>
      </section>
    </div>
  );
}

function ServiceBlock({
  section,
  alternate,
}: {
  section: ServiceSection;
  alternate: boolean;
}) {
  const Icon = section.icon;
  return (
    <section
      id={section.id}
      className={`scroll-mt-32 px-4 py-16 md:px-6 md:py-20 ${
        alternate ? "bg-subtle" : "bg-background"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-start md:gap-16">
          <div>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-estate-700/10 text-estate-700">
              <Icon className="h-7 w-7" strokeWidth={1.6} />
            </span>
            <p className="mt-5 font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
              {section.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              {section.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground md:text-lg">
              {section.lead}
            </p>
          </div>

          <div>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {section.body}
            </p>
            <ul className="mt-6 space-y-2.5">
              {section.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-foreground md:text-base">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-estate-700" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <SectionCTA cta={section.cta} />
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-estate-700" />
              Rent Smart Wales · Propertymark CMP Registered · No hidden fees
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionCTA({ cta }: { cta: ServiceSection["cta"] }) {
  const { openBuyer, openSeller, openAccount } = useLeadModals();
  const handle = () => {
    if (cta.action === "buyer") openBuyer();
    else if (cta.action === "seller") openSeller();
    else if (cta.action === "account") openAccount();
  };

  const inner: ReactNode = (
    <>
      {cta.label} <ArrowRight className="ml-1.5 h-4 w-4" />
    </>
  );

  if (cta.href) {
    return (
      <Link
        href={cta.href}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-estate-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-estate-600"
      >
        {inner}
      </Link>
    );
  }

  return (
    <Button onClick={handle} className="bg-estate-700 text-white hover:bg-estate-600">
      {inner}
    </Button>
  );
}

function SpeakToAdvisor() {
  const { openAccount } = useLeadModals();
  return (
    <button
      type="button"
      onClick={openAccount}
      className="mt-7 inline-flex h-12 items-center justify-center gap-1.5 rounded-md bg-gold-500 px-7 text-sm font-semibold text-white shadow-lg shadow-gold-500/20 transition-colors hover:bg-gold-400"
    >
      Speak to an advisor <ArrowRight className="ml-1 h-4 w-4" />
    </button>
  );
}
