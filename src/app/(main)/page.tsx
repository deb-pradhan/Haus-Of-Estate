import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageSquareText, UserRoundCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { OpenBuyerButton } from "@/components/lead-modal/open-buyer-button";
import { ServicesToggle } from "@/components/services/services-toggle";
import { PropertyShowcase } from "@/components/landing/property-showcase";
import { BuyRentSell } from "@/components/landing/buy-rent-sell";
import { HomepageFaq } from "@/components/landing/homepage-faq";
import { HomepageReviews } from "@/components/landing/homepage-reviews";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";
import { buildPropertiesHref } from "@/lib/property-taxonomy";

export const revalidate = 60;

// Root layout no longer sets a global canonical, so the home page declares its own.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* ─── How it works ────────────────────────────────────────────────────
 * Replaces the old trust bar. Describes the process only — no statistics
 * or ratings that cannot be evidenced (see docs/mega-upgrade/audits/legal.md).
 */
const STEPS = [
  {
    icon: MessageSquareText,
    title: "Tell us what you need",
    body: "Share your market, budget and timeline. It takes about two minutes and there is no obligation.",
  },
  {
    icon: UserRoundCheck,
    title: "Meet the right advisor",
    body: "We introduce you to a local agent who knows the market you are buying, selling or renting in.",
  },
  {
    icon: KeyRound,
    title: "Move with clarity",
    body: "Clear next steps from first viewing to completion, with the paperwork explained in plain English.",
  },
];

function HowItWorks() {
  return (
    <section className="section-y bg-paper-soft px-5 md:px-8" aria-labelledby="how-it-works">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2
            id="how-it-works"
            className="mt-4 font-serif text-title-1 font-medium leading-[1.05] text-estate-700"
          >
            One enquiry. A clear path home.
          </h2>
          <p className="lede mt-5">
            Buying property abroad should feel calm, not complicated. We keep
            it to three steps.
          </p>
        </Reveal>

        <ol className="mt-14 grid gap-5 md:mt-20 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 90}>
              <div className="h-full rounded-[1.75rem] bg-white p-8 shadow-e1 md:p-10">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-estate-700/8 text-estate-700">
                  <step.icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
                </span>
                <p className="mt-8 text-sm font-semibold tabular-nums text-gold-700">
                  0{index + 1}
                </p>
                <h3 className="mt-1 font-serif text-title-3 font-medium text-estate-700">
                  {step.title}
                </h3>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─── Markets ─────────────────────────────────────────────────────── */
const MARKETS = [
  {
    name: "Dubai",
    note: "Off-plan and ready homes across the emirate",
    href: buildPropertiesHref({ location: "Dubai" }),
  },
  {
    name: "United Kingdom",
    note: "London and beyond, for UK and overseas buyers",
    href: buildPropertiesHref({ location: "London" }),
  },
  {
    name: "Bali",
    note: "Villas and land, with local ownership guidance",
    href: buildPropertiesHref({ location: "Bali, Indonesia" }),
  },
];

function Markets() {
  return (
    <section className="section-y px-5 md:px-8" aria-labelledby="markets">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Where we work</p>
          <h2
            id="markets"
            className="mt-4 font-serif text-title-1 font-medium leading-[1.05] text-estate-700"
          >
            Start with the market you have in mind.
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-5 md:mt-16 md:grid-cols-3 md:gap-6">
          {MARKETS.map((market, index) => (
            <Reveal as="li" key={market.name} delay={index * 90}>
              <Link
                href={market.href}
                className="lift group relative flex min-h-[18rem] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-estate-800 p-8 text-white shadow-e2 md:min-h-[22rem] md:p-10"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    backgroundImage:
                      "radial-gradient(90% 70% at 85% 0%, rgba(196,168,122,0.28), transparent 60%), linear-gradient(160deg, #1f4f2f 0%, #0f2a19 100%)",
                  }}
                />
                <ArrowUpRight
                  aria-hidden
                  className="relative h-6 w-6 self-end text-gold-300 transition-transform duration-300 ease-out-expo group-hover:-translate-y-1 group-hover:translate-x-1"
                />
                <div className="relative">
                  <h3 className="font-serif text-title-2 font-medium leading-none">
                    {market.name}
                  </h3>
                  <p className="mt-3 max-w-[18rem] text-[1.0625rem] leading-snug text-white/75">
                    {market.note}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-300">
                    See properties <ArrowRight className="h-4 w-4" aria-hidden />
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── Our approach (commitments in our control, not claims) ──────────── */
const COMMITMENTS = [
  {
    title: "Plain-English advice",
    body: "Costs, taxes and timelines explained up front, with the assumptions shown.",
  },
  {
    title: "Your details stay yours",
    body: "We share your enquiry only with the agent you ask us to introduce.",
  },
  {
    title: "Free to enquire",
    body: "Our introductions are free to you. If we receive a referral fee from the agent or developer you choose, we will tell you before you proceed.",
  },
];

function Approach() {
  return (
    <section
      id="about"
      className="section-y bg-paper-soft px-5 md:px-8"
      aria-labelledby="approach"
    >
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1fr_1.1fr] md:gap-20">
        <Reveal>
          <p className="eyebrow">Our approach</p>
          <h2
            id="approach"
            className="mt-4 font-serif text-title-1 font-medium leading-[1.05] text-estate-700"
          >
            Property, with proof.
          </h2>
          <p className="lede mt-5 max-w-md">
            Haus of Estate is an international property service for buyers,
            landlords and investors moving across borders. We put clarity
            first, so every decision is one you can explain.
          </p>
          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-estate-700 underline-offset-4 hover:underline"
          >
            Read our story <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>

        <ul className="divide-y divide-hairline rounded-[1.75rem] bg-white shadow-e1">
          {COMMITMENTS.map((item, index) => (
            <Reveal as="li" key={item.title} delay={index * 90} className="p-7 md:p-9">
              <h3 className="font-serif text-title-3 font-medium text-estate-700">
                {item.title}
              </h3>
              <p className="mt-2 text-[1.0625rem] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── Closing CTA ─────────────────────────────────────────────────── */
function CTABanner() {
  return (
    <section className="relative isolate overflow-hidden bg-estate-900 px-5 py-24 text-white md:px-8 md:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(80% 90% at 50% 120%, rgba(196,168,122,0.22), transparent 60%), linear-gradient(180deg, #123221 0%, #0f2a19 100%)",
          }}
        />
      </div>

      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="font-serif text-title-1 font-medium leading-[1.05]">
          Ready when you are.
        </h2>
        <p className="lede mx-auto mt-5 max-w-xl text-white/75">
          Tell us what you are looking for and an advisor will take it from
          there. No obligation, no pressure.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <OpenBuyerButton size="lg" variant="gold">
            Speak to an advisor <ArrowRight className="h-4 w-4" aria-hidden />
          </OpenBuyerButton>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:border-white/60 hover:bg-white/10 hover:text-white"
          >
            <Link href="/list-property">List your property</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

function PropertyShowcaseFallback() {
  return (
    <section className="section-y px-5 md:px-8" aria-label="Featured properties loading">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-white shadow-e1"
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
      <HowItWorks />
      <DeferredSection estimatedHeight={900}>
        <ServicesToggle />
      </DeferredSection>
      <DeferredSection>
        <Suspense fallback={<PropertyShowcaseFallback />}>
          <PropertyShowcase />
        </Suspense>
      </DeferredSection>
      <DeferredSection estimatedHeight={600}>
        <Markets />
      </DeferredSection>
      <DeferredSection estimatedHeight={600}>
        <Approach />
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
