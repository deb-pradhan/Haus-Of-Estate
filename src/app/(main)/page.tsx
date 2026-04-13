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
          UK | UAE | Indonesia
        </p>

        {/* Headline — max 2 lines on mobile */}
        <h1 className="max-w-2xl font-serif text-4xl font-medium leading-tight text-white md:text-6xl md:leading-[1.05]">
          {greeting} —{" "}
          <span className="text-gold-400">your global property journey</span> starts here.
        </h1>

        {/* Sub-headline */}
        <p className="mt-4 flex flex-wrap items-center gap-2 text-base text-white/70 md:text-lg">
          <Check className="h-4 w-4 shrink-0 text-gold-400" />
          Verified properties.
          <Check className="h-4 w-4 shrink-0 text-gold-400" />
          Transparent prices.
          <Check className="h-4 w-4 shrink-0 text-gold-400" />
          No hidden fees.
        </p>

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
            Find My Property <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Explore Dubai Marina — from $280K
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
    text: "Exceptional service from start to finish. The team at Haus of Estate guided us through the entire process and we closed on our dream apartment in Marina Gate within 6 weeks.",
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
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            Client stories
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Rated 4.8 / 5 — Excellent
          </h2>

          {/* Market ratings */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
            {MARKET_RATINGS.map((m) => (
              <div key={m.market} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
                  <span className="font-serif text-lg font-semibold text-estate-700">{m.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground">{m.market} ({m.count})</p>
              </div>
            ))}
          </div>
        </div>

        {/* Platform links */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {/* TrustPilot */}
          <a
            href="https://www.trustpilot.com/review/hausofestate.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-2 shadow-sm transition-shadow hover:shadow-md"
          >
            <svg viewBox="0 0 60 14" className="h-5 w-auto" fill="none">
              <path d="M5.6 0L3.5 5.2H0L2.9 8.1L2.2 13.4L5.6 10.4L9 13.4L8.3 8.1L11.2 5.2H7.7L5.6 0Z" fill="#00B67A"/>
              <path d="M14.2 0L12.1 5.2H8.6L11.5 8.1L10.8 13.4L14.2 10.4L17.6 13.4L16.9 8.1L19.8 5.2H16.3L14.2 0Z" fill="#00B67A"/>
              <path d="M22.8 0L20.7 5.2H17.2L20.1 8.1L19.4 13.4L22.8 10.4L26.2 13.4L25.5 8.1L28.4 5.2H24.9L22.8 0Z" fill="#00B67A"/>
              <path d="M31.4 0L29.3 5.2H25.8L28.7 8.1L28 13.4L31.4 10.4L34.8 13.4L34.1 8.1L37 5.2H33.5L31.4 0Z" fill="#00B67A"/>
              <path d="M40 0L37.9 5.2H34.4L37.3 8.1L36.6 13.4L40 10.4L43.4 13.4L42.7 8.1L45.6 5.2H42.1L40 0Z" fill="#00B67A"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground leading-none">TrustPilot</span>
              <span className="flex items-center gap-0.5 mt-0.5">
                <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                <span className="text-xs text-muted-foreground">4.8/5</span>
              </span>
            </div>
          </a>

          {/* Google */}
          <a
            href="#"
            className="flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-2 shadow-sm transition-shadow hover:shadow-md"
          >
            <svg viewBox="0 0 60 14" className="h-5 w-auto">
              <path d="M59.9 7.1c0-.5-.04-.9-.12-1.3H30v2.5h16.4c-.7 3.8-2.8 7-5.9 9.2l-.1.1 8.6 6.7.6.1c5.5-5 8.3-12.4 8.3-21.1z" fill="#4285F4"/>
              <path d="M30 13.8c3.1 0 5.7-1 7.6-2.8l-7.3-5.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6h-7.8l-.1.1-.1.1v4.7l5.8 4.5c1.4-1.3 3.3-2.1 5.4-2.1h4.7z" fill="#34A853"/>
              <path d="M23.7 8.4c-.3-.8-.4-1.7-.4-2.6 0-.9.1-1.8.4-2.6V1.5H16l-.1.1-.1.1-.1.1v4.6l6.9 5.1z" fill="#FBBC04"/>
              <path d="M30 2.5c1.7 0 3.2.6 4.3 1.7l3.2-3.2C37.7.6 34.2 0 30 0 18.5 0 9.2 7 6.8 16.4L6.7 16.5l.1.1 7.8 6.1c1.6-3.9 5-6.7 9.2-6.7h4.2z" fill="#EA4335"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground leading-none">Google</span>
              <span className="flex items-center gap-0.5 mt-0.5">
                <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                <span className="text-xs text-muted-foreground">4.8/5</span>
              </span>
            </div>
          </a>
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

const DEAL_TICKER = [
  "Villa in Dubai Marina sold — AED 4.2M",
  "3-Bed in Manchester under offer — GBP 680K",
  "Penthouse in Palm Jumeirah reserved — AED 18.5M",
  "2-Bed in Downtown Dubai sold — AED 3.1M",
  "Townhouse in Canggu sold — IDR 12B",
];

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

// ─── Who Are We (condensed) ───────────────────────────────────────────────────

function WhoAreWe() {
  const { ref, visible } = useScrollReveal();

  const STATS = [
    { value: "15+", label: "Years Experience", icon: Clock },
    { value: "3", label: "Continents", icon: Globe },
    { value: "100%", label: "Transparent", icon: Shield },
  ];

  return (
    <section
      id="about"
      ref={ref}
      className={`px-4 py-16 transition-all duration-700 md:px-6 md:py-24 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
              Who we are
            </p>
            <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              The international real estate you can rely on.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Curating 15+ years of international real estate experience, Haus of Estate brings investing in real estate to an open eye-level and accessible to the global public.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Making each transaction transparent, swift and efficient. Originated in the UK, covering the UAE, and now expanding into international emerging markets.
            </p>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center md:text-left">
                  <s.icon className="mx-auto mb-1 h-5 w-5 text-gold-500 md:mx-0" />
                  <p className="font-serif text-3xl font-semibold text-estate-700">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
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
                { name: "Taylor Whimpey", color: "#1E3A5F" },
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

            <div className="mt-6 rounded-xl border border-border bg-estate-700/5 p-4">
              <p className="text-sm text-estate-700 font-medium">UK | UAE | International</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Originated in the UK, covering the UAE, and now international emerging markets.
              </p>
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
