"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Globe2,
  Handshake,
  ShieldCheck,
  TrendingUp,
  Users,
  Clock,
  BookOpen,
  Home,
  KeyRound,
  Building2,
  HardHat,
  GraduationCap,
  ClipboardCheck,
  ShoppingBag,
  Tag,
  Settings2,
  Plane,
  Briefcase,
  Newspaper,
  Lightbulb,
  Mail,
  Phone,
  MessageCircle,
  Star,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "@/components/lead-modal/modal-context";
import { TeamPreview } from "@/components/team/team-preview";
import { SocialProfileLinks } from "@/components/social/social-profile-links";

// ── Contact details (kept in sync with the site footer) ──────────────────
const COMPANY_PHONE_DISPLAY = "+44 7496 033321";
const COMPANY_PHONE_HREF = "tel:+447496033321";
const WHATSAPP_URL = "https://wa.me/447496033321";
const COMPANY_EMAIL = "info@hausofestate.com";

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

// ── What We Do — the property categories we cover ────────────────────────
const WHAT_WE_DO = [
  {
    icon: Home,
    title: "Residential Sales",
    body: "Homes and investment flats matched to your brief across the UK and UAE — from first-time purchases to prime second homes.",
  },
  {
    icon: KeyRound,
    title: "Lettings",
    body: "Long and short-let opportunities for tenants, plus a fully referenced letting service for landlords who want it handled.",
  },
  {
    icon: Building2,
    title: "Commercial Real Estate",
    body: "Offices, retail and mixed-use assets for occupiers and investors seeking income and capital growth.",
  },
  {
    icon: HardHat,
    title: "Off-Plan Properties",
    body: "Early access to selected developments with direct developer relationships — secured on the same terms as the agents who built them.",
  },
  {
    icon: GraduationCap,
    title: "Student Accommodation",
    body: "Purpose-built and buy-to-let student units in the UK's strongest university cities, sized for yield and resilience.",
  },
  {
    icon: ClipboardCheck,
    title: "Property Management",
    body: "End-to-end management for landlords and overseas owners — tenancy, maintenance and reporting, under one roof.",
  },
];

// ── Why Invest With Us — our four advantages ─────────────────────────────
const WHY_INVEST = [
  {
    icon: BookOpen,
    title: "Market Expertise",
    body:
      "Research-led, not commission-led. Our briefings draw on developer data, transaction comparables and on-the-ground reads — given to you straight, even when it points away from a sale.",
  },
  {
    icon: TrendingUp,
    title: "Exclusive Opportunities",
    body:
      "Direct relationships with world-class developers mean you see opportunities that don't reach the open market — and we negotiate on the terms of an insider, not an outsider.",
  },
  {
    icon: Globe2,
    title: "International Reach",
    body:
      "A specialist on the ground in your target market, working alongside a relationship manager in your timezone. The coverage of an international firm; the response time of a boutique.",
  },
  {
    icon: Handshake,
    title: "End-to-End Support",
    body:
      "Buy, renovate, let, manage or sell — handled under one roof. The pathway is the product, not just the introduction.",
  },
];

// ── Our Services — what we do for you ────────────────────────────────────
const SERVICES = [
  { icon: ShoppingBag, title: "Buying", body: "Sourcing, negotiation and due diligence for buyers and investors." },
  { icon: Tag, title: "Selling", body: "Positioning, pricing and qualified buyers to achieve the right outcome." },
  { icon: KeyRound, title: "Renting", body: "Tenancies and lettings for renters and landlords across our markets." },
  { icon: Settings2, title: "Property Management", body: "Hands-off ownership for landlords and overseas investors." },
  { icon: Plane, title: "Relocation Support", body: "Financing routes, regulation and the practical steps of moving across borders." },
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
  { region: "United Kingdom", note: "Cardiff · London · Manchester · Birmingham" },
  { region: "Dubai & the UAE", note: "Dubai · Sharjah · Abu Dhabi · Ras Al Khaimah" },
  { region: "International investment", note: "Indonesia Bali · Thailand · Malaysia" },
];

// ── Featured statistics — updated regularly ──────────────────────────────
const STATS = [
  { value: "1,200+", label: "Properties Listed" },
  { value: "12", label: "Countries Served" },
  { value: "1,247+", label: "Clients Assisted" },
  { value: "350+", label: "Investment Opportunities" },
];

// ── Areas We Cover ───────────────────────────────────────────────────────
const AREAS = [
  "Cardiff",
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Bristol",
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ras Al Khaimah",
  "Bali",
  "Kuala Lumpur",
];

// ── Property insights ────────────────────────────────────────────────────
const INSIGHTS = [
  { icon: Newspaper, title: "Latest Market News", body: "What's moving prices, yields and policy across our markets." },
  { icon: BookOpen, title: "Investment Guides", body: "Practical playbooks for buying across borders with confidence." },
  { icon: Lightbulb, title: "Buying & Renting Tips", body: "Straight advice for buyers, tenants and landlords." },
];

// ── Client testimonials ──────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Sarah M.",
    market: "Buyer · Dubai",
    initials: "SM",
    text: "Exceptional service from start to finish. The team guided us through the entire process and we completed on our flat in Marina Gate within six weeks.",
  },
  {
    name: "James T.",
    market: "Investor · Manchester",
    initials: "JT",
    text: "As an overseas buyer I was nervous about Manchester. Their transparency on yields and market data gave me complete confidence.",
  },
  {
    name: "Priya & Arjun L.",
    market: "Sellers · Bali",
    initials: "PL",
    text: "We listed our Ubud villa and had a qualified buyer within three weeks. Professional throughout and the transaction was seamless.",
  },
  {
    name: "Maria S.",
    market: "Landlord · London",
    initials: "MS",
    text: "Moving from Singapore as a non-resident was daunting. They made everything simple — from mortgage advice to management post-purchase.",
  },
];

export default function AboutPage() {
  const { openAccount, openNewsletter } = useLeadModals();
  const [newsletterEmail, setNewsletterEmail] = useState("");

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
            Redefining Real Estate Across the{" "}
            <span className="text-gold-400">UK &amp; UAE.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            Haus of Estate is an international property service for buyers, landlords and investors moving across borders. Vetted specialists, unbiased market data, and a single clear pathway from first enquiry to completion — anywhere our clients want to go.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={openAccount}
              size="lg"
              className="bg-gold-500 text-white hover:bg-gold-400"
            >
              Contact us <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Link href="/properties">
                Explore properties <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Company introduction ───────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-12 md:gap-16 md:px-6 md:py-24">
          <div className="md:col-span-5">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              Who we are
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              One firm, one relationship, every market.
            </h2>
          </div>
          <div className="md:col-span-7">
            <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              <p>
                We bring residential, commercial and off-plan property under a single, transparent service — connecting clients in the UK, Dubai and international markets with vetted specialists rather than a wall of listings.
              </p>
              <p>
                What makes us different is restraint. We curate the opportunities we&apos;d put our own clients into, we share the data behind every recommendation, and we stay with you from first enquiry through completion and beyond. The pathway is the product — not just the introduction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Origin / Story ─────────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-12 md:gap-16 md:px-6 md:py-28">
          <div className="md:col-span-5">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              Our story
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

      {/* ─── Our markets ────────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              Our markets
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              United Kingdom · Dubai · International.
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Originated in the UK. Coverage extending across the UAE and into selected international investment markets — wherever you&apos;re moving capital, the same calibre of advice.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {MARKETS.map((m) => (
              <div
                key={m.region}
                className="rounded-2xl border border-border bg-canvas/50 p-7 md:p-8"
              >
                <h3 className="font-serif text-2xl font-medium text-estate-700">
                  {m.region}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {m.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── What we do ─────────────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              What we do
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              Every property need, under one roof.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_WE_DO.map((w) => (
              <div
                key={w.title}
                className="group rounded-2xl border border-border bg-surface p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-estate-700/10 text-estate-700 transition-colors group-hover:bg-estate-700 group-hover:text-white">
                  <w.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-medium text-estate-700">
                  {w.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why invest with us ─────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
                Why invest with us
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
                Why our work compounds where others stall.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                We compete with the largest international firms on coverage and with the best local agents on speed. The four advantages below are how we hold both at once.
              </p>
            </div>
            <div className="md:col-span-8">
              <ol className="divide-y divide-border rounded-2xl border border-border bg-canvas/50">
                {WHY_INVEST.map((m, idx) => (
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

      {/* ─── Our services ───────────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              Our services
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              However you move, we move with you.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border bg-surface p-6 text-center"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-medium text-estate-700">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured statistics ────────────────────────────────────── */}
      <section className="bg-estate-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-serif text-4xl font-semibold text-gold-400 md:text-5xl">
                  {s.value}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-white/70 md:text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-white/50">
            Figures updated regularly and indicative of current activity across our markets.
          </p>
        </div>
      </section>

      {/* ─── Areas we cover ─────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              Areas we cover
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              From Cardiff to Abu Dhabi.
            </h2>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {AREAS.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas/50 px-4 py-2 text-sm font-medium text-estate-700"
              >
                <MapPin className="h-3.5 w-3.5 text-gold-500" />
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who we serve ───────────────────────────────────────────── */}
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

      {/* ─── What we believe ────────────────────────────────────────── */}
      <section className="bg-surface">
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
                className="group rounded-2xl border border-border bg-subtle p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-8"
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

      {/* ─── Meet our team ──────────────────────────────────────────── */}
      <TeamPreview />

      {/* ─── Client testimonials ────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
              Client testimonials
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              From buyers, sellers, landlords &amp; investors.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border border-border bg-surface p-7 md:p-8"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <blockquote className="mt-4 text-base leading-relaxed text-muted-foreground">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-estate-700/10 font-serif text-sm font-semibold text-estate-700">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block font-serif text-base font-medium text-estate-700">
                      {t.name}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {t.market}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Property insights ──────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
                Property insights
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
                Market news, guides and straight advice.
              </h2>
            </div>
            <Button asChild variant="outline" size="lg">
              <Link href="/blog">
                Read our insights <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {INSIGHTS.map((i) => (
              <Link
                key={i.title}
                href="/blog"
                className="group rounded-2xl border border-border bg-canvas/50 p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500">
                  <i.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-medium text-estate-700">
                  {i.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {i.body}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-gold-600 transition-transform group-hover:translate-x-0.5">
                  Explore <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Careers ────────────────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
                Careers at Haus of Estate
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
                Build your career with us.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                We&apos;re a 24-hour business across three continents, hiring people who put the client first. Explore our current internship and full-time vacancies, then apply with your CV, LinkedIn profile and a short cover letter.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-estate-700 text-white hover:bg-estate-700/90">
                  <Link href="/careers#jobs">
                    Current opportunities <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/careers#jobs">Apply now</Link>
                </Button>
              </div>
            </div>
            <div className="md:col-span-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <Briefcase className="h-6 w-6 text-gold-500" />
                  <h3 className="mt-4 font-serif text-lg font-medium text-estate-700">
                    Full-time roles
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Property consultants, client managers and marketing specialists across the UK and UAE.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <GraduationCap className="h-6 w-6 text-gold-500" />
                  <h3 className="mt-4 font-serif text-lg font-medium text-estate-700">
                    Internships
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Hands-on placements for those starting out — real work, real mentorship, real responsibility.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-6 sm:col-span-2">
                  <ClipboardCheck className="h-6 w-6 text-gold-500" />
                  <h3 className="mt-4 font-serif text-lg font-medium text-estate-700">
                    How to apply
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Upload your CV, add your LinkedIn profile and a short cover letter on the careers page. We read every application and reply to those that fit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact & social ───────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="font-serif text-sm font-medium uppercase tracking-[0.25em] text-gold-500">
                Get in touch
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
                Talk to a specialist.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Reach us by email, phone or WhatsApp — offices in the UK and UAE, serving clients worldwide.
              </p>
              <SocialProfileLinks
                className="mt-7 gap-2.5"
                linkClassName="bg-canvas/50 hover:bg-estate-700 hover:text-white"
                iconClassName="h-5 w-5"
              />
            </div>
            <div className="md:col-span-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <a
                  href={`mailto:${COMPANY_EMAIL}`}
                  className="group rounded-2xl border border-border bg-canvas/50 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Mail className="h-6 w-6 text-gold-500" />
                  <p className="mt-4 font-serif text-base font-medium text-estate-700">Email</p>
                  <p className="mt-1 text-sm text-muted-foreground break-words">{COMPANY_EMAIL}</p>
                </a>
                <a
                  href={COMPANY_PHONE_HREF}
                  className="group rounded-2xl border border-border bg-canvas/50 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Phone className="h-6 w-6 text-gold-500" />
                  <p className="mt-4 font-serif text-base font-medium text-estate-700">Phone</p>
                  <p className="mt-1 text-sm text-muted-foreground">{COMPANY_PHONE_DISPLAY}</p>
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-border bg-canvas/50 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <MessageCircle className="h-6 w-6 text-gold-500" />
                  <p className="mt-4 font-serif text-base font-medium text-estate-700">WhatsApp</p>
                  <p className="mt-1 text-sm text-muted-foreground">Chat with us</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Newsletter signup ──────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-6 md:py-20">
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl font-medium text-estate-700 md:text-3xl">
              Receive the latest property opportunities &amp; market insights.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Cross-border property insight, straight to your inbox. No spam — unsubscribe anytime.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              openNewsletter(newsletterEmail);
            }}
            className="flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-surface p-1.5"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder="Your email address"
              aria-label="Your email address"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-400"
            >
              Subscribe <ArrowRight className="h-4 w-4" />
            </button>
          </form>
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
                Ready to buy, rent, invest or build your career?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/80 md:text-lg">
                Contact Haus of Estate today. A 15-minute conversation is enough to know whether we&apos;re the right firm for what you&apos;re trying to do. No waiting list. No obligation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={openAccount}
                size="lg"
                className="bg-gold-500 text-white hover:bg-gold-400"
              >
                Contact us <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Link href="/properties">
                  Explore properties <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-8 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold-400" /> 1,247+ clients worldwide
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
