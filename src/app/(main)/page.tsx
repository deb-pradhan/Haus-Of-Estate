"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Shield,
  TrendingUp,
  Star,
  Play,
  Calendar,
  Home,
  TrendingUp as InvestIcon,
  Video,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "@/components/lead-modal";

// ─── Brand color helpers ────────────────────────────────────────────────────────

function TrustBar() {
  const items = [
    { icon: <BadgeCheck className="h-5 w-5 text-trust-teal" />, label: "15+ Years International Experience" },
    { icon: <Shield className="h-5 w-5 text-estate-700" />, label: "RERA & FCA-Regulated" },
    { icon: <TrendingUp className="h-5 w-5 text-action-amber" />, label: "Transparent Transactions" },
  ];
  return (
    <section className="border-b border-border bg-surface px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground md:gap-12">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────────

function HeroSection() {
  const { openBuyer, openSeller } = useLeadModals();

  return (
    <section className="relative overflow-hidden bg-estate-700 px-4 py-16 md:px-6 md:py-28">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gold-500" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-gold-500" />
      </div>

      {/* Trust pilot badge top-right */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="h-3 w-3 fill-gold-500 text-gold-500" />
          ))}
        </div>
        <span className="text-xs font-medium text-white">4.8 Excellent</span>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="mb-3 font-serif text-sm font-medium uppercase tracking-widest text-gold-400 opacity-80">
            UK | UAE | International Presence
          </p>
          <h1 className="font-serif text-4xl font-medium leading-tight text-white md:text-6xl md:leading-[1.05]">
            Your initial step towards a global property portfolio
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
            The international real estate you can rely on. Curating 15+ years of experience across three continents — making every transaction transparent, swift, and efficient.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={openBuyer}
              size="lg"
              className="bg-gold-500 text-white hover:bg-gold-400"
            >
              Looking to Buy or Rent?
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              onClick={openSeller}
              size="lg"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Sell or Rent Your Property?
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Who Are We ─────────────────────────────────────────────────────────────────

const DEVELOPERS = [
  { name: "Emaar", color: "#1a1a1a" },
  { name: "Damac", color: "#8B0000" },
  { name: "Binghatti", color: "#2C3E50" },
  { name: "Taylor Whimpey", color: "#1E3A5F" },
  { name: "BIOM", color: "#3D6B4F" },
  { name: "Barrett Homes", color: "#4A3728" },
];

function DeveloperLogo({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="flex h-12 items-center justify-center rounded-lg px-4 opacity-60 grayscale transition-opacity hover:opacity-100"
      style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: 1 }}
    >
      <span
        className="font-serif text-sm font-semibold tracking-wide"
        style={{ color }}
      >
        {name}
      </span>
    </div>
  );
}

function WhoAreWe() {
  return (
    <section id="about" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Left: brand narrative */}
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
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              We're globally present and a 24/7 business — we help investors and end-users make property choices globally, backed by a team of trusted, accountable professionals.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: "15+", label: "Years experience" },
                { value: "3", label: "Continents" },
                { value: "100%", label: "Transparent" },
              ].map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="font-serif text-3xl font-semibold text-estate-700">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: developer logos */}
          <div>
            <p className="mb-4 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
              Trusted by world-class developers
            </p>
            <div className="grid grid-cols-2 gap-3">
              {DEVELOPERS.map((dev) => (
                <DeveloperLogo key={dev.name} name={dev.name} color={dev.color} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Services Toggle ─────────────────────────────────────────────────────────────

function ServicesToggle() {
  const [active, setActive] = useState<"buy" | "sell">("buy");
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [useType, setUseType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [area, setArea] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const { openAccount } = useLeadModals();

  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="services" className="bg-subtle px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-estate-700/10">
            <Check className="h-7 w-7 text-estate-700" />
          </div>
          <h3 className="font-serif text-2xl font-medium text-estate-700">
            One of our agents will be in touch within 2 hours.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We've received your enquiry and our team will personalised recommendations based on your criteria.
          </p>
          <Button onClick={openAccount} className="mt-6 bg-estate-700 text-white hover:bg-estate-600">
            Explore More Services <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="bg-subtle px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            What we offer
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            How can we help you?
          </h2>
        </div>

        {/* Toggle */}
        <div className="mx-auto mb-8 flex w-fit rounded-full border border-border bg-surface p-1">
          {[
            { id: "buy" as const, label: "Looking to buy or rent?" },
            { id: "sell" as const, label: "Looking to sell or rent?" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setActive(opt.id); setSubmitted(false); }}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                active === opt.id
                  ? "bg-estate-700 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Buy / Rent form */}
        {active === "buy" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
            <div className="mb-6 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Personal use or investment?</p>
                <div className="flex gap-2">
                  {["Personal", "Investment"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setUseType(opt.toLowerCase())}
                      className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                        useType === opt.toLowerCase()
                          ? "border-estate-700 bg-estate-700/5 text-estate-700"
                          : "border-border bg-white text-muted-foreground hover:border-estate-700/30"
                      }`}
                    >
                      {opt === "Personal" ? <Home className="mx-auto mb-1 h-4 w-4" /> : <InvestIcon className="mx-auto mb-1 h-4 w-4" />}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {useType && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Bedrooms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["1", "2", "3", "4", "5+"].map((b) => (
                        <button
                          key={b}
                          onClick={() => setBedrooms(b)}
                          className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium ${
                            bedrooms === b
                              ? "border-estate-700 bg-estate-700/5 text-estate-700"
                              : "border-border bg-white text-muted-foreground hover:border-estate-700/30"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Area preference</p>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select area</option>
                      <option value="dubai-marina">Dubai Marina</option>
                      <option value="dubai-downtown">Downtown Dubai</option>
                      <option value="dubai-palm">Palm Jumeirah</option>
                      <option value="uk-london">London</option>
                      <option value="uk-manchester">Manchester</option>
                      <option value="bali-canggu">Canggu</option>
                      <option value="other">Other / Not sure</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {useType && bedrooms && area && (
              <form onSubmit={handleBuySubmit} className="space-y-3 border-t border-border pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    type="email"
                    required
                    className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="Mobile number"
                  type="tel"
                  required
                  className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" className="h-11 w-full bg-estate-700 text-white hover:bg-estate-600">
                  Get Matched <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Sell / Rent form */}
        {active === "sell" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location / Area"
                  className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Size (sqft)"
                  className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Bedrooms</p>
                <div className="flex flex-wrap gap-1.5">
                  {["1", "2", "3", "4", "5+"].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBedrooms(b)}
                      className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium ${
                        bedrooms === b
                          ? "border-estate-700 bg-estate-700/5 text-estate-700"
                          : "border-border bg-white text-muted-foreground hover:border-estate-700/30"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              {location && bedrooms && (
                <form
                  onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                  className="space-y-3 border-t border-border pt-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      type="email"
                      required
                      className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="Mobile number"
                    type="tel"
                    required
                    className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-estate-700 text-white hover:bg-estate-600">
                      List My Property <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                    <Link href="/list-property">
                      <Button variant="outline" type="button" className="border-estate-700 text-estate-700">
                        Full Form
                      </Button>
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Book a Call ────────────────────────────────────────────────────────────────

function BookACall() {
  const CALENDLY_URL = "https://calendly.com/hausofestate-info";

  const handleBook = () => {
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
              Book a call
            </p>
            <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              Speak to an expert — for free.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Not sure where to start? Book a 15-minute video or audio call with one of our property specialists. No obligation, no hard sell — just honest advice.
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Personalised market briefing for your goals",
                "Investment yield and risk overview",
                "Visa and relocation guidance",
                "No commitment required",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-trust-teal" />
                  {item}
                </li>
              ))}
            </ul>
            <Button
              onClick={handleBook}
              size="lg"
              className="mt-6 bg-estate-700 text-white hover:bg-estate-600"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book a Free Call
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
              alt="Video call consultation"
              width={600}
              height={400}
              className="rounded-2xl object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handleBook}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
              >
                <Play className="ml-1 h-6 w-6 text-estate-700" fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Video Content ─────────────────────────────────────────────────────────────

function VideoContent() {
  const videos = [
    {
      title: "Hi, I'm Lisa — Welcome to Haus of Estate",
      desc: "An introduction to who we are and what we do across three continents.",
      thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=70",
    },
    {
      title: "Investing in Dubai: What you need to know",
      desc: "A breakdown of the Dubai property market, yield opportunities, and key considerations.",
      thumbnail: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=70",
    },
    {
      title: "Moving to the UK: Property guide for overseas buyers",
      desc: "How to navigate the UK property market as a non-resident investor.",
      thumbnail: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=600&q=70",
    },
  ];

  return (
    <section className="bg-estate-700 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-400 opacity-80">
            Our channel
          </p>
          <h2 className="font-serif text-3xl font-medium text-white md:text-4xl">
            Hi, we're Haus of Estate.
          </h2>
          <p className="mt-2 text-base text-white/60">
            Expert insights, market updates, and property guides — delivered by our team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {videos.map((video) => (
            <div
              key={video.title}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm">
                    <Play className="ml-0.5 h-5 w-5 text-estate-700" fill="currentColor" />
                  </button>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
                  <Video className="h-3 w-3" />
                  Video
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-white">{video.title}</p>
                <p className="mt-1 text-xs text-white/50">{video.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

const REVIEWS = [
  {
    name: "Sarah M.",
    market: "Dubai",
    rating: 5,
    text: "Exceptional service from start to finish. The team at Haus of Estate guided us through the entire process and we closed on our dream apartment in Marina Gate within 6 weeks.",
  },
  {
    name: "James T.",
    market: "UK",
    rating: 5,
    text: "As an overseas buyer, I was initially nervous about investing in Manchester. Their transparency on yields and market data gave me complete confidence. Highly recommend.",
  },
  {
    name: "Priya & Arjun L.",
    market: "Bali",
    rating: 5,
    text: "We listed our Ubud villa with Haus of Estate and had a qualified buyer within 3 weeks. The team handled everything professionally and the transaction was seamless.",
  },
];

function ReviewsSection() {
  return (
    <section id="reviews" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            Trusted by clients worldwide
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Rated 4.8 / 5 — Excellent
          </h2>

          {/* Rating platforms */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-5 w-5 fill-gold-500 text-gold-500" />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">TrustPilot</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-5 w-5 fill-estate-700 text-estate-700" />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Google</p>
            </div>
          </div>
        </div>

        {/* Review cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {REVIEWS.map((review) => (
            <div
              key={review.name}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= review.rating ? "fill-gold-500 text-gold-500" : "fill-mist-400 text-mist-400"}`}
                    />
                  ))}
                </div>
                <span className="rounded-full bg-subtle px-2 py-0.5 text-xs text-muted-foreground">
                  {review.market}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">"{review.text}"</p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">— {review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ────────────────────────────────────────────────────────────────

function CTABanner() {
  const { openAccount } = useLeadModals();

  return (
    <section className="bg-deep-olive px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-medium text-white md:text-4xl">
          Building your pathway to property internationally.
        </h2>
        <p className="mt-3 text-base text-white/60">
          Whether you're buying your first home, investing across borders, or selling a premium asset — our team is ready to help.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button
            onClick={openAccount}
            size="lg"
            className="bg-gold-500 text-white hover:bg-gold-400"
          >
            Get in Touch
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/list-property">List Your Property</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <WhoAreWe />
      <ServicesToggle />
      <BookACall />
      <VideoContent />
      <ReviewsSection />
      <CTABanner />
    </>
  );
}
