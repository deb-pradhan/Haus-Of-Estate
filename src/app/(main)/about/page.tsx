"use client";

import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  Handshake,
  ShieldCheck,
  TrendingUp,
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
  Newspaper,
  Lightbulb,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "@/components/lead-modal/modal-context";
import { TeamPreview } from "@/components/team/team-preview";
import { RegulationBlock } from "@/components/legal/regulation-block";
import { COMPANY_IDENTITY } from "@/lib/company-identity";
import { FEE_DISCLOSURE_COPY, RESPONSE_TIME_COPY } from "@/lib/site-claims";
import { RiskWarning } from "@/components/legal/risk-warning";

// ── Contact details (kept in sync with the site footer) ──────────────────
const COMPANY_PHONE_DISPLAY = "+44 7496 033321";
const COMPANY_PHONE_HREF = "tel:+447496033321";
const WHATSAPP_URL = "https://wa.me/971585607033";
const COMPANY_EMAIL = COMPANY_IDENTITY.generalEmail;

const BELIEFS = [
  {
    icon: Handshake,
    title: "Clear, honest advice.",
    body: "We aim to explain how an introduction works before you proceed, and to tell you plainly when we are not the right fit. We do not pressure you to buy, sell or let.",
  },
  {
    icon: TrendingUp,
    title: "Fit before volume.",
    body: "We do not try to list every project. We introduce you to agents and developers who match your brief, and we will say so if we think you should wait.",
  },
  {
    icon: Clock,
    title: "Responsive, never pushy.",
    body: `We reply ${RESPONSE_TIME_COPY}, and we do not chase you when you are not ready.`,
  },
  {
    icon: ShieldCheck,
    title: "Fees stated up front.",
    body: `${FEE_DISCLOSURE_COPY} Property involves risk, and we will say so.`,
  },
];

// ── What We Do — the property categories we cover ────────────────────────
const WHAT_WE_DO = [
  {
    icon: Home,
    title: "Residential sales",
    body: "Introductions to agents selling homes and investment flats across the UK and UAE, from first purchases to second homes.",
  },
  {
    icon: KeyRound,
    title: "Lettings",
    body: "Introductions to letting agents, for tenants looking for a home and landlords looking for a tenant.",
  },
  {
    icon: Building2,
    title: "Commercial property",
    body: "Introductions to agents handling offices, retail and mixed-use property for occupiers and investors.",
  },
  {
    icon: HardHat,
    title: "Off-plan property",
    body: "Introductions to selected off-plan developments through licensed brokers. Off-plan purchases carry delivery and completion risk.",
  },
  {
    icon: GraduationCap,
    title: "Student accommodation",
    body: "Introductions to agents selling purpose-built and buy-to-let student property in UK university cities.",
  },
  {
    icon: ClipboardCheck,
    title: "Property management",
    body: "Introductions to managing agents for landlords and overseas owners.",
  },
];

// ── Why Invest With Us — our four advantages ─────────────────────────────
const WHY_INVEST = [
  {
    icon: BookOpen,
    title: "Plain-English market information",
    body: "We point you to published market data, explain what it does and does not tell you, and say where it is limited.",
  },
  {
    icon: ShieldCheck,
    title: "Introductions to licensed professionals",
    body: "We aim to introduce you only to agents and brokers who are licensed to trade in their market. After the introduction, your transaction is with the agent or developer you choose.",
  },
  {
    icon: Globe2,
    title: "Several markets, one starting point",
    body: "We work across the UK, the UAE and selected international markets through local agents and brokers, so you can start in one place.",
  },
  {
    icon: Handshake,
    title: "One point of contact",
    body: "We keep your enquiry in one place and introduce you to the right agent for each step: buying, letting, selling or managing.",
  },
];

// ── Our Services — what we do for you ────────────────────────────────────
const SERVICES = [
  { icon: ShoppingBag, title: "Buying", body: "Introductions to agents who can source properties and negotiate for you." },
  { icon: Tag, title: "Selling", body: "Introductions to agents who can value and market your property." },
  { icon: KeyRound, title: "Renting", body: "Introductions to letting agents for renters and landlords across our markets." },
  { icon: Settings2, title: "Property management", body: "Introductions to managing agents for landlords and overseas owners." },
  { icon: Plane, title: "Relocation information", body: "Plain-English information on the practical steps of moving across borders. We do not give mortgage or tax advice." },
];

const AUDIENCES = [
  {
    title: "Investors",
    body:
      "Buyers looking at property as a long-term investment. We introduce you to agents and explain the risks. We do not give investment advice.",
  },
  {
    title: "First-time international buyers",
    body:
      "Families relocating across borders, or buying a second home overseas. We explain the steps involved in plain English and introduce you to local professionals.",
  },
  {
    title: "Landlords and portfolio holders",
    body:
      "Owners who want to sell, let or consolidate. We introduce you to an agent in the right market.",
  },
];

const MARKETS = [
  { region: "United Kingdom", note: "Cardiff · London · Manchester · Birmingham · Edinburgh" },
  { region: "Dubai & the UAE", note: "Dubai · Abu Dhabi" },
  { region: "International", note: "Bali, Indonesia, and other selected markets" },
];

// ── Areas We Cover ───────────────────────────────────────────────────────
const AREAS = [
  "Cardiff",
  "London",
  "Manchester",
  "Birmingham",
  "Edinburgh",
  "Dubai",
  "Abu Dhabi",
  "Bali",
];

// ── Property insights ────────────────────────────────────────────────────
const INSIGHTS = [
  { icon: Newspaper, title: "Latest Market News", body: "What's moving prices, yields and policy across our markets." },
  { icon: BookOpen, title: "Investment Guides", body: "Practical playbooks for buying across borders with confidence." },
  { icon: Lightbulb, title: "Buying & Renting Tips", body: "Straight advice for buyers, tenants and landlords." },
];

// ── Social media ─────────────────────────────────────────────────────────
const SOCIALS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/haus_of_estate/",
    icon: <Instagram className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/115804984/",
    icon: <Linkedin className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61560983191278",
    icon: <Facebook className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: "Pinterest",
    href: "https://in.pinterest.com/hausofestate/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.406.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.03-.655 2.569-.992 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.001 24 18.627 24 24 18.627 24 12 24 5.372 18.627 0 12 0z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@Hausofestate",
    icon: <Youtube className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: "X",
    href: "https://x.com/hausofestate",
    icon: <XGlyph className="h-5 w-5" />,
  },
];

function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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
          <p className="eyebrow eyebrow-dark">About Haus of Estate</p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] md:text-6xl md:leading-[1.05]">
            International property,{" "}
            <span className="text-gold-400">made clearer.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            Haus of Estate is an international property service for buyers, landlords and investors moving across borders. We introduce you to estate agents and brokers in each market, with one clear starting point for your enquiry.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={openAccount}
              size="lg"
              variant="gold"
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
            <p className="eyebrow">
              Who we are
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              One firm, one relationship, every market.
            </h2>
          </div>
          <div className="md:col-span-7">
            <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              <p>
                We bring residential, commercial and off-plan property enquiries into a single service, connecting people in the UK, Dubai and selected international markets with estate agents and brokers rather than a wall of listings.
              </p>
              <p>
                We do not try to list everything. We introduce you to agents who fit your brief and explain how the process works. Once you have been introduced, your purchase, sale or tenancy is with the agent or developer you choose. Haus of Estate is not a party to it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Origin / Story ─────────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-12 md:gap-16 md:px-6 md:py-28">
          <div className="md:col-span-5">
            <p className="eyebrow">
              Our story
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              One starting point for property across borders.
            </h2>
          </div>
          <div className="md:col-span-7">
            <div className="space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              <p>
                Haus of Estate began with a simple observation: people relocating, buying across borders or letting abroad often deal with several agents in different countries, each working from different information.
              </p>
              <p>
                We set out to give them one clear starting point: tell us what you are looking for, and we will introduce you to a suitable agent in the right market.
              </p>
              <p>
                We are a UK company, registered in England and Wales, working with agents and brokers in the UAE and selected international markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Our markets ────────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">
              Our markets
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              United Kingdom · Dubai · International.
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              A UK company working with agents and brokers in the UAE and selected international markets.
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
            <p className="eyebrow">
              What we do
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              Every property need, one starting point.
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

      {/* ─── Why work with us ─────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <p className="eyebrow">
                Why work with us
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
                What you can expect from us.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                We are an introducer, not your agent. These are the things we aim to do well.
              </p>
            </div>
            <div className="md:col-span-8">
              <ol className="divide-y divide-border rounded-2xl border border-border bg-canvas/50">
                {WHY_INVEST.map((m, idx) => (
                  <li key={m.title} className="flex gap-5 p-6 md:gap-7 md:p-8">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700">
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
            <p className="eyebrow">
              Our services
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              Introductions for every kind of move.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border bg-surface p-6 text-center"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700">
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
          <RiskWarning className="mx-auto mt-10 max-w-3xl" />
        </div>
      </section>

      {/* ─── Company details and regulation ─────────────────────────── */}
      <section className="bg-estate-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="eyebrow eyebrow-dark">Company details</p>
              <p className="mt-3 font-serif text-2xl font-medium">
                {COMPANY_IDENTITY.name} is a trading name of {COMPANY_IDENTITY.legalName}.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                Registered in {COMPANY_IDENTITY.registeredJurisdiction}, company number{" "}
                <a
                  href={COMPANY_IDENTITY.companiesHouseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-white"
                >
                  {COMPANY_IDENTITY.number}
                </a>
                . Registered office: {COMPANY_IDENTITY.registeredOffice}.{" "}
                <a
                  href={COMPANY_IDENTITY.icoRegisterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-white"
                >
                  ICO registration {COMPANY_IDENTITY.icoRegistrationNumber}
                </a>
                .
              </p>
            </div>
            <div className="space-y-4">
              <RegulationBlock tone="dark" />
              <p className="text-sm leading-relaxed text-white/80">
                Not happy with something? Read{" "}
                <Link href="/legal/complaints" className="underline underline-offset-4 hover:text-white">
                  how to make a complaint
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Areas we cover ─────────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">
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
                <MapPin className="h-3.5 w-3.5 text-gold-700" />
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
            <p className="eyebrow">
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
                <p className="eyebrow">
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
            <p className="eyebrow">
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

      {/* ─── Property insights ──────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700">
                  <i.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-medium text-estate-700">
                  {i.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {i.body}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-gold-700 transition-transform group-hover:translate-x-0.5">
                  Explore <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact & social ───────────────────────────────────────── */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="eyebrow">
                Get in touch
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
                Get in touch.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Reach us by email, phone or WhatsApp.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-canvas/50 text-estate-700 transition-colors hover:bg-estate-700 hover:text-white"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
            <div className="md:col-span-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <a
                  href={`mailto:${COMPANY_EMAIL}`}
                  className="group rounded-2xl border border-border bg-canvas/50 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Mail className="h-6 w-6 text-gold-700" />
                  <p className="mt-4 font-serif text-base font-medium text-estate-700">Email</p>
                  <p className="mt-1 text-sm text-muted-foreground break-words">{COMPANY_EMAIL}</p>
                </a>
                <a
                  href={COMPANY_PHONE_HREF}
                  className="group rounded-2xl border border-border bg-canvas/50 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Phone className="h-6 w-6 text-gold-700" />
                  <p className="mt-4 font-serif text-base font-medium text-estate-700">Phone</p>
                  <p className="mt-1 text-sm text-muted-foreground">{COMPANY_PHONE_DISPLAY}</p>
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-border bg-canvas/50 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <MessageCircle className="h-6 w-6 text-gold-700" />
                  <p className="mt-4 font-serif text-base font-medium text-estate-700">WhatsApp</p>
                  <p className="mt-1 text-sm text-muted-foreground">Chat with us</p>
                </a>
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
              <p className="eyebrow eyebrow-dark">Take the next step</p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight md:text-5xl">
                Ready to buy, rent or invest?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/80 md:text-lg">
                Tell us what you are trying to do and we will reply {RESPONSE_TIME_COPY}. There is no obligation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={openAccount}
                size="lg"
                variant="gold"
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
              <Globe2 className="h-4 w-4 text-gold-400" /> UK · UAE · International
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
