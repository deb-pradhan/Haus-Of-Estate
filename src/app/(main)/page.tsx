import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenBuyerButton } from "@/components/lead-modal/open-buyer-button";
import { ServicesToggle } from "@/components/services/services-toggle";
import { PropertyShowcase } from "@/components/landing/property-showcase";
import { BuyRentSell } from "@/components/landing/buy-rent-sell";
import { HomepageFaq } from "@/components/landing/homepage-faq";
import { HomepageReviews } from "@/components/landing/homepage-reviews";
import { Partners } from "@/components/landing/partners";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";

export const revalidate = 60;

const TRUST_ITEMS = [
  {
    icon: <BadgeCheck className="h-5 w-5 text-trust-teal" />,
    label: "Rent Smart Wales Registered",
  },
  {
    icon: <Shield className="h-5 w-5 text-estate-700" />,
    label: "Propertymark CMP Registered",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-action-amber" />,
    label: "Transparent Transactions",
  },
  {
    icon: <Users className="h-5 w-5 text-copper-clay" />,
    label: "1,200+ clients matched since 2022",
  },
];

const TEAM_AVATARS = [
  { initials: "LF", name: "Lisa" },
  { initials: "AK", name: "Ahmed" },
  { initials: "MR", name: "Maria" },
  { initials: "DR", name: "David" },
];

function TrustBar() {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-4 md:gap-12">
        {TRUST_ITEMS.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-sm text-muted-foreground opacity-0-init animate-fade-up"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhoAreWe() {
  return (
    <section id="about" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
              Who we are
            </p>
            <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              The international property service you can rely on.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Haus of Estate is an international property service for buyers,
              landlords and investors moving across borders — vetted
              specialists, unbiased market data, and a single clear pathway
              from first enquiry to completion.
            </p>
            <Link
              href="/about"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-estate-700 transition-colors hover:text-gold-500"
            >
              Read our story
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <p className="mb-4 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
              Why clients choose us
            </p>
            <ul className="space-y-3">
              {[
                "Vetted agents only — never a junior on commission",
                "Transparent advice with no hidden fees",
                "One pathway from first enquiry to completion",
                "Rent Smart Wales & Propertymark CMP Registered",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-estate-700 px-4 py-16 md:px-6 md:py-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-20 top-10 h-64 w-64 animate-float rounded-full bg-gold-500/5" />
        <div
          className="absolute -left-20 bottom-10 h-48 w-48 animate-float rounded-full bg-trust-teal/5"
          style={{ animationDelay: "-2s" }}
        />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-medium text-white md:text-4xl">
          Start your global property journey today.
        </h2>
        <p className="mt-3 text-base text-white/60">
          Advisors are available now — no waiting list, no obligation. Your next
          property is one conversation away.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {TEAM_AVATARS.map((avatar) => (
              <div
                key={avatar.initials}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-estate-700 bg-estate-600 text-xs font-semibold text-white"
                title={avatar.name}
              >
                {avatar.initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-white/60">
            Join{" "}
            <span className="font-semibold text-white">
              1,200+ clients matched since 2022
            </span>
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <OpenBuyerButton
            size="lg"
            className="relative overflow-hidden bg-gold-500 text-white shadow-lg shadow-gold-500/20 hover:bg-gold-400"
          >
            <span className="absolute inset-0 animate-shimmer" />
            <span className="relative flex items-center gap-2">
              Start My Journey <ArrowRight className="h-4 w-4" />
            </span>
          </OpenBuyerButton>
          <Link href="/list-property">
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              List Your Property
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5" /> SSL Secured
          </span>
          <span className="flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5" /> GDPR
          </span>
        </div>
      </div>
    </section>
  );
}

function PropertyShowcaseFallback() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24" aria-label="Featured properties loading">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
    </section>
  );
}

function DeferredSection({
  children,
  estimatedHeight = 800,
}: {
  children: ReactNode;
  estimatedHeight?: number;
}) {
  return (
    <div
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `auto ${estimatedHeight}px`,
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <BuyRentSell />
      <TrustBar />
      <Partners />
      <DeferredSection estimatedHeight={900}>
        <ServicesToggle />
      </DeferredSection>
      <DeferredSection>
        <Suspense fallback={<PropertyShowcaseFallback />}>
          <PropertyShowcase />
        </Suspense>
      </DeferredSection>
      <DeferredSection estimatedHeight={600}>
        <WhoAreWe />
      </DeferredSection>
      <DeferredSection>
        <Suspense fallback={null}>
          <HomepageReviews />
        </Suspense>
      </DeferredSection>
      <DeferredSection estimatedHeight={700}>
        <Suspense fallback={null}>
          <HomepageFaq />
        </Suspense>
      </DeferredSection>
      <DeferredSection estimatedHeight={400}>
        <CTABanner />
      </DeferredSection>
      <WhatsAppFloat />
    </>
  );
}
