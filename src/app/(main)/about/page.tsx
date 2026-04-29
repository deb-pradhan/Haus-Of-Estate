"use client";

import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Globe2,
  Handshake,
  ShieldCheck,
  TrendingUp,
  Users,
  Clock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "@/components/lead-modal/modal-context";

const BELIEFS = [
  {
    icon: Handshake,
    title: "Trust is the product.",
    body: "Every enquiry is handled by a vetted specialist — never an algorithm, never a junior on commission. Clear advice, from first call through to completion.",
  },
  {
    icon: TrendingUp,
    title: "The right deal beats the loudest one.",
    body: "We don't list every project; we curate the ones we'd put our own clients into. Selected developments in selected locations — and the discipline to say no to the rest.",
  },
  {
    icon: Clock,
    title: "Always on, never pushy.",
    body: "A 24-hour business spread across the UK, UAE and beyond. We answer when you need us. We don't chase you when you don't.",
  },
  {
    icon: ShieldCheck,
    title: "Transparency, on the record.",
    body: "No hidden fees. No undisclosed referral kickbacks. The yields, fees and risks are on the page before you book the call.",
  },
];

const MOAT = [
  {
    icon: Globe2,
    title: "Cross-border developer partnerships",
    body:
      "Direct relationships with world-class developers across the UK, UAE and emerging markets — so you see opportunities that don't reach the open market, and we can negotiate on the same terms as the agents who built the relationship.",
  },
  {
    icon: BookOpen,
    title: "Unbiased market intelligence",
    body:
      "Research-led, not commission-led. Our briefings draw on developer data, transaction comparables and on-the-ground reads — given to you straight, even when it points away from a sale.",
  },
  {
    icon: Compass,
    title: "Local expertise, globally coordinated",
    body:
      "A specialist on the ground in your target market, working alongside a relationship manager in your timezone. The coverage of an international firm; the response time of a boutique.",
  },
  {
    icon: Handshake,
    title: "End-to-end transaction support",
    body:
      "Buy, renovate, let, manage or sell — handled under one roof. The pathway is the product, not just the introduction.",
  },
];

const AUDIENCES = [
  {
    title: "Investors",
    body:
      "Long-horizon buyers seeking durable returns and currency-resilient portfolios. We help structure the entry, manage the asset, and plan the exit.",
  },
  {
    title: "First-time international buyers",
    body:
      "Families relocating across borders — or buying a second home overseas. We translate regulatory steps, financing routes and on-the-ground considerations into a single calm process.",
  },
  {
    title: "Landlords and portfolio holders",
    body:
      "Owners ready to consolidate, recycle or scale. From a single property in Manchester to a multi-asset portfolio across the Gulf, we help reposition rather than just resell.",
  },
];

const MARKETS = [
  { region: "United Kingdom", note: "London · Manchester · Birmingham" },
  { region: "United Arab Emirates", note: "Dubai · Abu Dhabi" },
  { region: "International emerging markets", note: "Bali · Southeast Asia" },
];

export default function AboutPage() {
  const { openAccount } = useLeadModals();

  return (
    <div className="min-h-screen bg-canvas">
      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-estate-700 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gold-400/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-trust-teal/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-32">
          <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-400">
            About Haus of Estate
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] md:text-6xl md:leading-[1.05]">
            Property,{" "}
            <span className="text-gold-400">internationally.</span>
            <br className="hidden md:block" /> Without the friction.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            Haus of Estate is an international property service for buyers, landlords and investors moving across borders. Vetted specialists, unbiased market data, and a single clear pathway from first enquiry to completion — anywhere our clients want to go.
          </p>
        </div>
      </section>

      {/* ─── Origin / Story ─────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-12 md:gap-16 md:px-6 md:py-28">
          <div className="md:col-span-5">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              Our origin
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              Built in the gap most agencies pretend doesn&apos;t exist.
            </h2>
          </div>
          <div className="md:col-span-7">
            <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              <p>
                Haus of Estate began with a simple observation: the people most in need of trusted property advice — families relocating, investors buying across borders, landlords repositioning portfolios — were the ones being served the worst.
              </p>
              <p>
                Through a period of global turbulence, we watched clients get pulled between agents in different countries, briefed on different data, sold the same property at three different prices. The international market was working for everyone except the buyer.
              </p>
              <p>
                We built a different model. One firm, one relationship, one transparent record of advice — operating across the UK, the UAE, and now international emerging markets. Originated in the UK. Tested in the toughest cycles. Designed to outlast them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Beliefs / Promise ──────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              What we believe
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              Four promises we don&apos;t break.
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              The non-negotiables behind every enquiry, viewing, and transaction we handle.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {BELIEFS.map((b) => (
              <div
                key={b.title}
                className="group rounded-2xl border border-border bg-surface p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-8"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-estate-700/10 text-estate-700 transition-colors group-hover:bg-estate-700 group-hover:text-white">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-medium text-estate-700">
                  {b.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Moat ───────────────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
                The Haus of Estate moat
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
                Why our work compounds where others stall.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                We compete with the largest international firms — Colliers, Hamptons, Cushman &amp; Wakefield, Savills — on coverage. We compete with the best local agents on speed. The four advantages below are how we hold both at once.
              </p>
            </div>

            <div className="md:col-span-8">
              <ol className="divide-y divide-border rounded-2xl border border-border bg-canvas/50">
                {MOAT.map((m, idx) => (
                  <li key={m.title} className="flex gap-5 p-6 md:gap-7 md:p-8">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500">
                      <m.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-serif text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        0{idx + 1}
                      </p>
                      <h3 className="mt-1 font-serif text-xl font-medium text-estate-700 md:text-2xl">
                        {m.title}
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                        {m.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Audiences ──────────────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              Who we serve
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              Three clients, one standard of care.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {AUDIENCES.map((a, idx) => (
              <div
                key={a.title}
                className="rounded-2xl border border-border bg-surface p-7 md:p-8"
              >
                <p className="font-serif text-xs font-medium uppercase tracking-[0.25em] text-gold-500">
                  0{idx + 1}
                </p>
                <h3 className="mt-2 font-serif text-2xl font-medium text-estate-700">
                  {a.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Markets ────────────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
                Where we work
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
                A single firm. Three continents. One standard.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Originated in the UK. Coverage extending across the UAE and into selected international markets. Wherever you&apos;re moving capital, you should have the same calibre of advice.
              </p>
            </div>
            <div className="md:col-span-7">
              <ul className="grid gap-4">
                {MARKETS.map((m) => (
                  <li
                    key={m.region}
                    className="flex items-baseline justify-between gap-6 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <span className="font-serif text-xl font-medium text-estate-700 md:text-2xl">
                      {m.region}
                    </span>
                    <span className="text-right text-sm text-muted-foreground md:text-base">
                      {m.note}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid grid-cols-3 gap-6">
                <div>
                  <p className="font-serif text-3xl font-semibold text-estate-700 md:text-4xl">15+</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Years of experience</p>
                </div>
                <div>
                  <p className="font-serif text-3xl font-semibold text-estate-700 md:text-4xl">3</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Continents</p>
                </div>
                <div>
                  <p className="font-serif text-3xl font-semibold text-estate-700 md:text-4xl">24/7</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Specialist coverage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="bg-estate-700 text-white">
        <div className="mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-24">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-400">
                Take the next step
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight md:text-5xl">
                Speak with a specialist.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/80 md:text-lg">
                A 15-minute conversation is enough to know whether we&apos;re the right firm for what you&apos;re trying to do. No waiting list. No obligation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={openAccount}
                size="lg"
                className="bg-gold-500 text-white hover:bg-gold-400"
              >
                Book a consultation <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Link href="/blog">
                  Read our insights <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-8 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold-400" /> 1,247+ clients worldwide
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold-400" /> RERA &amp; FCA-regulated
            </span>
            <span className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-gold-400" /> UK · UAE · International
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
