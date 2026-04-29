"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Shield,
  TrendingUp,
  Star,
  Check,
  ChevronDown,
  Clock,
  User,
  Users,
  Building2,
  Globe,
  Eye,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "@/components/lead-modal";
import { ServicesToggle } from "@/components/services/services-toggle";
import { PropertyShowcase } from "@/components/landing/property-showcase";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Scroll reveal hook ────────────────────────────────────────────────────────

function useScrollReveal(threshold = 0.15) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return { ref: setRef, visible };
}

// ─── Animated counter ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal();

  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);

  return { ref, count };
}

// ─── TrustBar ─────────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: <BadgeCheck className="h-5 w-5 text-trust-teal" />, label: "RERA & FCA-Regulated" },
  { icon: <Shield className="h-5 w-5 text-estate-700" />, label: "15+ Years Experience" },
  { icon: <TrendingUp className="h-5 w-5 text-action-amber" />, label: "Transparent Transactions" },
  { icon: <Users className="h-5 w-5 text-copper-clay" />, label: "500+ Happy Clients" },
];

function TrustBar() {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-4 md:gap-12">
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-sm text-muted-foreground opacity-0-init animate-fade-up"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85";

function HeroSection() {
  const { openBuyer } = useLeadModals();
  const greeting = getGreeting();

  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-estate-700" aria-label="Hero">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Luxury property"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:py-28">
        {/* Eyebrow */}
        <p className="mb-3 font-serif text-sm font-medium uppercase tracking-widest text-gold-400 opacity-90">
          UK · UAE · International
        </p>

        {/* Headline — max 2 lines on mobile */}
        <h1 className="max-w-2xl font-serif text-4xl font-medium leading-tight text-white md:text-6xl md:leading-[1.05]">
          {greeting} —{" "}
          <span className="text-gold-400">your global property journey</span> starts here.
        </h1>

        {/* Sub-headline — stack on mobile, inline on tablet+ */}
        <ul className="mt-4 flex flex-col gap-2 text-base text-white/80 md:flex-row md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2 md:text-lg">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
            <span>Vetted estate agents.</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
            <span>Transparent advice.</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
            <span>No hidden fees.</span>
          </li>
        </ul>

        {/* CTA stack */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            onClick={openBuyer}
            size="lg"
            className="relative overflow-hidden bg-gold-500 text-white hover:bg-gold-400 shadow-lg shadow-gold-500/20"
          >
            <span className="absolute inset-0 animate-shimmer" />
            <span className="relative flex items-center gap-2">
              Book a Free Consultation <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
          >
            Speak to a Specialist <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        {/* Trust logos */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {["RERA", "FCA-Regulated", "Google 4.8", "TrustPilot"].map((t) => (
            <span key={t} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
              <Shield className="h-3 w-3" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce-gentle text-white/40"
        aria-label="Scroll down"
      >
        <ChevronDown className="h-6 w-6" />
      </button>
    </section>
  );
}

// ─── Book a Call ──────────────────────────────────────────────────────────────

const AGENTS = [
  {
    name: "Sonia",
    title: "Property Consultant",
    specialisation: "Bali & Southeast Asia",
    experience: "8+ years",
    markets: ["Bali", "Thailand", "Singapore"],
    calendly: "https://calendly.com/hausofestate-sonia",
  },
  {
    name: "Besh",
    title: "Property Consultant",
    specialisation: "Dubai & UK",
    experience: "10+ years",
    markets: ["Dubai", "UK", "UAE"],
    calendly: "https://calendly.com/hausofestate-besh",
  },
];

function BookACall() {
  const { ref, visible } = useScrollReveal();

  const handleBook = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="book"
      ref={ref}
      className={`px-4 py-16 transition-all duration-700 md:px-6 md:py-24 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            Speak with an expert
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Your free 15-minute consultation.
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            No obligation. No hard sell. Just honest advice from a global property expert.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {AGENTS.map((agent) => (
            <div key={agent.name} className="group relative">
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <div className="relative h-64">
                  <div className="absolute inset-0 bg-gradient-to-br from-estate-600 to-estate-800" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-white/10 p-6 backdrop-blur-sm">
                      <User className="h-20 w-20 text-white/80" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-serif text-2xl font-semibold text-white">{agent.name}</p>
                    <p className="text-sm text-white/70">{agent.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {agent.markets.map((m) => (
                        <span key={m} className="rounded-full bg-gold-500/30 px-2 py-0.5 text-xs text-gold-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-estate-700/5 p-3">
                      <p className="text-xs text-muted-foreground">Experience</p>
                      <p className="font-serif text-lg font-semibold text-estate-700">{agent.experience}</p>
                    </div>
                    <div className="rounded-xl bg-estate-700/5 p-3">
                      <p className="text-xs text-muted-foreground">Specialisation</p>
                      <p className="text-sm font-semibold text-estate-700">{agent.specialisation}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBook(agent.calendly)}
                    size="lg"
                    className="relative w-full overflow-hidden bg-estate-700 text-white hover:bg-estate-600 shadow-lg shadow-estate-700/20"
                  >
                    <span className="absolute inset-0 animate-shimmer" />
                    <span className="relative flex items-center justify-center gap-2">
                      Book with {agent.name} <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-estate-700" /> FCA-Regulated</span>
          <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-estate-700" /> 15+ Years Experience</span>
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-estate-700" /> 24/7 Support</span>
        </div>
      </div>
    </section>
  );
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

const ALL_REVIEWS = [
  {
    name: "Sarah M.",
    market: "Dubai",
    rating: 5,
    text: "Exceptional service from start to finish. The team at Haus of Estate guided us through the entire process and we completed on our dream flat in Marina Gate within 6 weeks.",
    initials: "SM",
    tag: "#TransparentProcess",
    date: "June 2024",
  },
  {
    name: "James T.",
    market: "UK",
    rating: 5,
    text: "As an overseas buyer, I was initially nervous about investing in Manchester. Their transparency on yields and market data gave me complete confidence. Highly recommend.",
    initials: "JT",
    tag: "#GlobalExpertise",
    date: "August 2024",
  },
  {
    name: "Priya & Arjun L.",
    market: "Bali",
    rating: 5,
    text: "We listed our Ubud villa with Haus of Estate and had a qualified buyer within 3 weeks. The team handled everything professionally and the transaction was seamless.",
    initials: "PL",
    tag: "#FastClosing",
    date: "September 2024",
  },
  {
    name: "Ahmed K.",
    market: "Dubai",
    rating: 5,
    text: "I've worked with several agencies in Dubai and Haus of Estate is by far the most transparent and professional. They found us a property that matched our brief perfectly.",
    initials: "AK",
    tag: "#TransparentProcess",
    date: "October 2024",
  },
  {
    name: "Maria S.",
    market: "UK",
    rating: 5,
    text: "Moving from Singapore to London as a non-resident was daunting. Haus of Estate made everything simple — from mortgage advice to property management post-purchase.",
    initials: "MS",
    tag: "#GlobalExpertise",
    date: "November 2024",
  },
  {
    name: "David R.",
    market: "Bali",
    rating: 5,
    text: "The Bali team sourced properties that weren't even on the market yet. Their local network is incredible. Closed on a villa in Canggu within 2 months of first enquiry.",
    initials: "DR",
    tag: "#FastClosing",
    date: "December 2024",
  },
];

const MARKET_RATINGS = [
  { market: "Dubai", rating: 4.9, count: 127 },
  { market: "UK", rating: 4.8, count: 84 },
  { market: "Bali", rating: 5.0, count: 31 },
];

function ReviewsSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section
      id="reviews"
      ref={ref}
      className={`px-4 py-16 transition-all duration-700 md:px-6 md:py-24 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            Client stories
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Rated 4.8 / 5 — Excellent
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Reviewed by clients across Trustpilot, Google and our markets in the UK, UAE and beyond.
          </p>
        </div>

        {/* Trust strip — platforms */}
        <div className="mb-5 flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <a
            href="https://www.trustpilot.com/review/hausofestate.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Read Haus of Estate reviews on Trustpilot"
            className="group flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
              <polygon
                points="12,2 15,9 22,9.3 16.5,14 18,21 12,17.5 6,21 7.5,14 2,9.3 9,9"
                fill="#00B67A"
              />
            </svg>
            <span className="text-sm font-semibold text-foreground">Trustpilot</span>
            <span aria-hidden className="h-4 w-px bg-border" />
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
              <span className="text-sm font-semibold text-estate-700">4.8</span>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </span>
          </a>

          <span aria-hidden className="hidden h-8 w-px bg-border md:block" />

          <a
            href="https://www.google.com/search?q=Haus+of+Estate"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Read Haus of Estate reviews on Google"
            className="group flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden>
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            <span className="text-sm font-semibold text-foreground">Google</span>
            <span aria-hidden className="h-4 w-px bg-border" />
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
              <span className="text-sm font-semibold text-estate-700">4.8</span>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </span>
          </a>
        </div>

        {/* Trust strip — markets (secondary) */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs md:text-sm">
          {MARKET_RATINGS.map((m, idx) => (
            <span key={m.market} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-muted-foreground">
                <Star className="h-3 w-3 fill-gold-500 text-gold-500" aria-hidden />
                <span className="font-semibold text-estate-700">{m.rating}</span>
                <span>·</span>
                <span>{m.market}</span>
                <span className="text-muted-foreground/70">({m.count})</span>
              </span>
              {idx < MARKET_RATINGS.length - 1 && (
                <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />
              )}
            </span>
          ))}
        </div>

        {/* Review marquee */}
        <div className="relative overflow-hidden" aria-label="Client reviews">
          {/* Fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />

          <div className="flex animate-marquee" style={{ width: "max-content" }}>
            {/* Doubled array for seamless loop */}
            {[...ALL_REVIEWS, ...ALL_REVIEWS].map((review, i) => (
              <article
                key={`${review.name}-${i}`}
                className="mx-3 flex w-80 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm"
                aria-label={`${review.name} review`}
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-estate-700/10 font-serif text-sm font-semibold text-estate-700">
                      {review.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.market}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: review.rating }).map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                    ))}
                  </div>
                </div>

                {/* Tag */}
                <div className="mb-3">
                  <span className="rounded-full bg-estate-700/8 px-2.5 py-0.5 text-xs font-medium text-estate-700">
                    {review.tag}
                  </span>
                </div>

                {/* Review text */}
                <p className="text-sm leading-relaxed text-foreground">"{review.text}"</p>

                {/* Footer */}
                <div className="mt-4 flex items-center border-t border-border pt-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-trust-teal" />
                    Verified — {review.date}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ──────────────────────────────────────────────────────────────

const TEAM_AVATARS = [
  { initials: "LF", name: "Lisa" },
  { initials: "AK", name: "Ahmed" },
  { initials: "MR", name: "Maria" },
  { initials: "DR", name: "David" },
];

function CTABanner() {
  const { ref, visible } = useScrollReveal();

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden bg-deep-olive px-4 py-16 transition-all duration-700 md:px-6 md:py-20 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-20 top-10 h-64 w-64 animate-float rounded-full bg-gold-500/5" />
        <div className="absolute -left-20 bottom-10 h-48 w-48 animate-float rounded-full bg-trust-teal/5" style={{ animationDelay: "-2s" }} />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-medium text-white md:text-4xl">
          Start your global property journey today.
        </h2>
        <p className="mt-3 text-base text-white/60">
          Advisors are available now — no waiting list, no obligation. Your next property is one conversation away.
        </p>

        {/* Team avatars */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {TEAM_AVATARS.map((a) => (
              <div
                key={a.initials}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-deep-olive bg-estate-700 text-xs font-semibold text-white"
                title={a.name}
              >
                {a.initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-white/60">
            Join <span className="font-semibold text-white">1,247+ clients</span> worldwide
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="relative overflow-hidden bg-gold-500 text-white hover:bg-gold-400 shadow-lg shadow-gold-500/20"
          >
            <span className="absolute inset-0 animate-shimmer" />
            <span className="relative flex items-center gap-2">
              Start My Journey <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
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

        {/* Trust logos */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> RERA-Regulated</span>
          <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> FCA-Compliant</span>
          <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> SSL Secured</span>
          <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> GDPR</span>
        </div>
      </div>
    </section>
  );
}

// ─── Who Are We (teaser) ─────────────────────────────────────────────────────

function WhoAreWe() {
  const { ref, visible } = useScrollReveal();

  return (
    <section
      id="about"
      ref={ref}
      className={`px-4 py-16 transition-all duration-700 md:px-6 md:py-24 ${visible ? "opacity-100" : "opacity-0"}`}
    >
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
              Haus of Estate is an international property service for buyers, landlords and investors moving across borders — vetted specialists, unbiased market data, and a single clear pathway from first enquiry to completion.
            </p>
            <Link
              href="/about"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-estate-700 transition-colors hover:text-gold-500"
            >
              Read our story
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Developer logos */}
          <div>
            <p className="mb-4 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
              Trusted by world-class developers
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Emaar", color: "#1a1a1a" },
                { name: "Damac", color: "#8B0000" },
                { name: "Taylor Wimpey", color: "#1E3A5F" },
                { name: "Binghatti", color: "#2C3E50" },
              ].map((dev) => (
                <div
                  key={dev.name}
                  className="flex h-12 items-center justify-center rounded-lg border border-border bg-surface px-4 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                >
                  <span className="font-serif text-sm font-semibold" style={{ color: dev.color }}>
                    {dev.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <ServicesToggle />
      <PropertyShowcase />
      <WhoAreWe />
      <BookACall />
      <ReviewsSection />
      <CTABanner />
      <WhatsAppFloat />
    </>
  );
}
