"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducer, useEffect, useRef, useCallback } from "react";
import {
  Home,
  TrendingUp,
  Palmtree,
  Key,
  Building2,
  Warehouse,
  Castle,
  Trees,
  MapPin,
  ChevronLeft,
  Check,
  ArrowRight,
  Lock,
  Share2,
  SlidersHorizontal,
  BadgeCheck,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ─── Types ──────────────────────────────────────────────────────────────────────

type Market = "dubai" | "uk" | "bali";
type Intent = "buy" | "invest" | "holiday" | "rent";
type Timeline = "immediately" | "1_3_months" | "3_6_months" | "exploring";
type BudgetRange = string;

interface QuizState {
  step: number;
  intent: Intent | null;
  market: Market | null;
  propertyTypes: string[];
  areas: string[];
  budget: BudgetRange | null;
  timeline: Timeline | null;
  firstName: string;
  whatsapp: string;
  email: string;
  phone: string;
  isSubmitting: boolean;
  isSubmitted: boolean;
  matchCount: number;
}

type QuizAction =
  | { type: "START" }
  | { type: "SET_INTENT"; payload: Intent }
  | { type: "SET_MARKET"; payload: Market }
  | { type: "TOGGLE_PROPERTY_TYPE"; payload: string }
  | { type: "TOGGLE_AREA"; payload: string }
  | { type: "SET_BUDGET"; payload: BudgetRange }
  | { type: "SET_TIMELINE"; payload: Timeline }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; payload: number }
  | { type: "UPDATE_FIELD"; payload: { field: "firstName" | "whatsapp" | "email" | "phone"; value: string } };

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START":
      return { ...state, step: 1 };
    case "SET_INTENT":
      return { ...state, intent: action.payload, step: 2 };
    case "SET_MARKET":
      return { ...state, market: action.payload, step: 3 };
    case "TOGGLE_PROPERTY_TYPE": {
      const exists = state.propertyTypes.includes(action.payload);
      return {
        ...state,
        propertyTypes: exists
          ? state.propertyTypes.filter((t) => t !== action.payload)
          : [...state.propertyTypes, action.payload],
      };
    }
    case "TOGGLE_AREA": {
      const exists = state.areas.includes(action.payload);
      const updated = exists
        ? state.areas.filter((a) => a !== action.payload)
        : state.areas.length < 3
          ? [...state.areas, action.payload]
          : state.areas;
      return { ...state, areas: updated };
    }
    case "SET_BUDGET":
      return { ...state, budget: action.payload, step: state.step + 1 };
    case "SET_TIMELINE":
      return { ...state, timeline: action.payload, step: 7 };
    case "NEXT":
      return { ...state, step: state.step + 1 };
    case "BACK":
      return { ...state, step: Math.max(1, state.step - 1) };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false, isSubmitted: true, step: 8, matchCount: action.payload };
    case "UPDATE_FIELD":
      return { ...state, [action.payload.field]: action.payload.value };
    default:
      return state;
  }
}

const initialState: QuizState = {
  step: 0,
  intent: null,
  market: null,
  propertyTypes: [],
  areas: [],
  budget: null,
  timeline: null,
  firstName: "",
  whatsapp: "",
  email: "",
  phone: "",
  isSubmitting: false,
  isSubmitted: false,
  matchCount: 0,
};

// ─── Market Data ────────────────────────────────────────────────────────────────

const MARKETS: {
  id: Market;
  label: string;
  tagline: string;
  flag: string;
}[] = [
  {
    id: "dubai",
    label: "Dubai, UAE",
    tagline: "Gulf's most dynamic property market",
    flag: "🇦🇪",
  },
  {
    id: "uk",
    label: "United Kingdom",
    tagline: "Historic markets, modern returns",
    flag: "🇬🇧",
  },
  {
    id: "bali",
    label: "Bali, Indonesia",
    tagline: "Tropical lifestyle investments",
    flag: "🇮🇩",
  },
];

// ─── Property Types per Market ─────────────────────────────────────────────────

const PROPERTY_TYPES: Record<
  Market,
  { id: string; label: string; imageSrc: string }[]
> = {
  dubai: [
    { id: "apartment", label: "Apartment", imageSrc: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=70" },
    { id: "villa", label: "Villa", imageSrc: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=70" },
    { id: "townhouse", label: "Townhouse", imageSrc: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=400&q=70" },
    { id: "penthouse", label: "Penthouse", imageSrc: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=70" },
  ],
  uk: [
    { id: "flat", label: "Flat / Apartment", imageSrc: "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=400&q=70" },
    { id: "house", label: "House", imageSrc: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=400&q=70" },
    { id: "cottage", label: "Cottage", imageSrc: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&q=70" },
    { id: "commercial", label: "Commercial", imageSrc: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=70" },
  ],
  bali: [
    { id: "villa", label: "Villa", imageSrc: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=70" },
    { id: "land", label: "Land", imageSrc: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=70" },
    { id: "bungalow", label: "Bungalow", imageSrc: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=70" },
    { id: "resort", label: "Resort / Hospitality", imageSrc: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=70" },
  ],
};

// ─── Areas per Market ──────────────────────────────────────────────────────────

const AREAS: Record<
  Market,
  { id: string; label: string; subtitle: string }[]
> = {
  dubai: [
    { id: "marina", label: "Dubai Marina", subtitle: "Waterfront living" },
    { id: "downtown", label: "Downtown Dubai", subtitle: "City centre buzz" },
    { id: "palm", label: "Palm Jumeirah", subtitle: "Island lifestyle" },
    { id: "jbr", label: "JBR", subtitle: "Beach & walk" },
    { id: "business_bay", label: "Business Bay", subtitle: "Work-life balance" },
    { id: "other", label: "Other / Not sure", subtitle: "We'll help you explore" },
  ],
  uk: [
    { id: "london", label: "London", subtitle: "Global financial hub" },
    { id: "manchester", label: "Manchester", subtitle: "Northern powerhouse" },
    { id: "birmingham", label: "Birmingham", subtitle: "Growth corridor" },
    { id: "liverpool", label: "Liverpool", subtitle: "Regeneration boom" },
    { id: "edinburgh", label: "Edinburgh", subtitle: "Capital stability" },
    { id: "other", label: "Other / Not sure", subtitle: "We'll help you explore" },
  ],
  bali: [
    { id: "canggu", label: "Canggu", subtitle: "Surf & social scene" },
    { id: "seminyak", label: "Seminyak", subtitle: "Beach club lifestyle" },
    { id: "ubud", label: "Ubud", subtitle: "Culture & nature" },
    { id: "uluwatu", label: "Uluwatu", subtitle: "Cliffs & luxury villas" },
    { id: "sanur", label: "Sanur", subtitle: "Family-friendly beach" },
    { id: "other", label: "Other / Not sure", subtitle: "We'll help you explore" },
  ],
};

// ─── Budget Ranges per Market ──────────────────────────────────────────────────

const BUDGET_RANGES: Record<
  Market,
  { buy: { id: string; label: string }[]; rent: { id: string; label: string }[] }
> = {
  dubai: {
    buy: [
      { id: "aed_under_1m", label: "Under AED 1M" },
      { id: "aed_1m_3m", label: "AED 1M – 3M" },
      { id: "aed_3m_7m", label: "AED 3M – 7M" },
      { id: "aed_7m_15m", label: "AED 7M – 15M" },
      { id: "aed_above_15m", label: "AED 15M+" },
    ],
    rent: [
      { id: "aed_rent_under_5k", label: "Under AED 5K /mo" },
      { id: "aed_rent_5k_10k", label: "AED 5K – 10K /mo" },
      { id: "aed_rent_10k_20k", label: "AED 10K – 20K /mo" },
      { id: "aed_rent_20k_50k", label: "AED 20K – 50K /mo" },
      { id: "aed_rent_above_50k", label: "AED 50K+ /mo" },
    ],
  },
  uk: {
    buy: [
      { id: "gbp_under_250k", label: "Under £250K" },
      { id: "gbp_250k_500k", label: "£250K – £500K" },
      { id: "gbp_500k_1m", label: "£500K – £1M" },
      { id: "gbp_1m_2m", label: "£1M – £2M" },
      { id: "gbp_above_2m", label: "£2M+" },
    ],
    rent: [
      { id: "gbp_rent_under_1k", label: "Under £1K /mo" },
      { id: "gbp_rent_1k_2k", label: "£1K – £2K /mo" },
      { id: "gbp_rent_2k_3k", label: "£2K – £3K /mo" },
      { id: "gbp_rent_3k_5k", label: "£3K – £5K /mo" },
      { id: "gbp_rent_above_5k", label: "£5K+ /mo" },
    ],
  },
  bali: {
    buy: [
      { id: "usd_under_200k", label: "Under $200K" },
      { id: "usd_200k_500k", label: "$200K – $500K" },
      { id: "usd_500k_1m", label: "$500K – $1M" },
      { id: "usd_1m_2m", label: "$1M – $2M" },
      { id: "usd_above_2m", label: "$2M+" },
    ],
    rent: [
      { id: "usd_rent_under_1k", label: "Under $1K /mo" },
      { id: "usd_rent_1k_2k", label: "$1K – $2K /mo" },
      { id: "usd_rent_2k_5k", label: "$2K – $5K /mo" },
      { id: "usd_rent_5k_10k", label: "$5K – $10K /mo" },
      { id: "usd_rent_above_10k", label: "$10K+ /mo" },
    ],
  },
};

// ─── Trust Signals per Market ──────────────────────────────────────────────────

const TRUST_SIGNALS: Record<Market, string[]> = {
  dubai: [
    "240+ Verified Listings",
    "Trusted RERA-Licensed Agents",
    "Zero Spam, Zero Obligation",
  ],
  uk: [
    "500+ Verified Listings",
    " FCA-Regulated Agents",
    "Zero Spam, Zero Obligation",
  ],
  bali: [
    "180+ Verified Listings",
    "Licensed Indonesian Agents",
    "Zero Spam, Zero Obligation",
  ],
};

// ─── Market Flag SVGs (inline) ─────────────────────────────────────────────────

function MarketIcon({ market }: { market: Market }) {
  if (market === "dubai") {
    return (
      <svg viewBox="0 0 60 40" className="h-8 w-12 overflow-visible">
        <rect width="60" height="40" rx="2" fill="#CE1126" />
        <rect y="13.33" width="60" height="13.33" fill="#fff" />
        <rect y="26.67" width="60" height="13.33" fill="#000" />
        <rect width="22.5" height="13.33" fill="#fff" />
        <path d="M11.25 3.33 L13.5 8.33 L18.75 8.33 L14.5 11.5 L16.25 16.67 L11.25 13.33 L6.25 16.67 L8 11.5 L3.75 8.33 L9 8.33 Z" fill="#009A00" />
      </svg>
    );
  }
  if (market === "uk") {
    return (
      <svg viewBox="0 0 60 40" className="h-8 w-12 overflow-visible">
        <rect width="60" height="40" rx="2" fill="#012169" />
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="6" />
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="4" />
        <path d="M30 0 V40 M0 20 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 40" className="h-8 w-12 overflow-visible">
      <rect width="60" height="40" rx="2" fill="#fff" />
      <rect width="60" height="13.33" fill="#CE1126" />
      <rect y="26.67" width="60" height="13.33" fill="#CE1126" />
      <rect width="22.5" height="13.33" fill="#fff" />
      <rect y="26.67" width="22.5" height="13.33" fill="#fff" />
      <rect x="37.5" width="22.5" height="13.33" fill="#fff" />
      <rect y="13.33" x="22.5" width="15" height="13.33" fill="#fff" />
      <path d="M11.25 3.33 L13.5 8.33 L18.75 8.33 L14.5 11.5 L16.25 16.67 L11.25 13.33 L6.25 16.67 L8 11.5 L3.75 8.33 L9 8.33 Z" fill="#000" />
      <rect x="37.5" y="13.33" width="22.5" height="13.33" fill="#000" />
    </svg>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.min(((step - 1) / (total - 1)) * 100, 100);
  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-border">
      <div
        className="h-full bg-estate-700 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Back Button ───────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Go back"
      className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/80 backdrop-blur-sm text-muted-foreground hover:bg-white hover:text-foreground transition-colors"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

// ─── Quiz Card ────────────────────────────────────────────────────────────────

interface QuizCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  imageSrc?: string;
  multi?: boolean;
}

function QuizCard({
  selected,
  onClick,
  label,
  subtitle,
  icon,
  imageSrc,
  multi,
}: QuizCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
        "min-h-[72px] cursor-pointer",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected
          ? "border-estate-700 bg-estate-700/5"
          : "border-border bg-white hover:border-estate-700/30 hover:shadow-md active:scale-[0.98]",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-estate-700 text-white" : "bg-muted text-muted-foreground",
        )}
      >
        {multi ? (
          <Check
            className={cn(
              "h-5 w-5 transition-all duration-200",
              selected ? "opacity-100 scale-100" : "opacity-0 scale-75",
            )}
          />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {!multi && selected && (
        <Check className="h-5 w-5 shrink-0 text-estate-700" />
      )}
    </button>
  );
}

// ─── Step 0: Hero ─────────────────────────────────────────────────────────────

const TRUST_ITEMS_GLOBAL = [
  "Verified Listings Across 3 Markets",
  "Licensed Agents in Each Region",
  "Zero Spam, Zero Obligation",
];

function HeroSection({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-16">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80"
          alt="Luxury property"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-estate-700/75" />
      </div>

      {/* Logo */}
      <div className="absolute left-4 top-4 z-10 opacity-60">
        <Image
          src="/Frame 16-2.svg"
          alt="Haus of Estate"
          width={100}
          height={54}
          className="h-6 w-auto brightness-0 invert"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-lg text-center">
        <h1 className="font-serif text-3xl font-medium leading-tight text-white md:text-5xl md:leading-[1.05]">
          Find Your Perfect Property in 90 Seconds
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/80 md:text-lg">
          Answer 5 quick questions across Dubai, the UK, and Bali. We'll match you with verified properties curated by our local team — not an algorithm.
        </p>
        <button
          onClick={onStart}
          className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-gold-400 hover:scale-[1.02] active:scale-[0.98]"
        >
          Find My Match
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/60">
          {TRUST_ITEMS_GLOBAL.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-gold-400" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Step 1: Intent ───────────────────────────────────────────────────────────

const INTENT_OPTIONS = [
  { id: "buy" as Intent, label: "Buy a property", icon: <Home className="h-5 w-5" /> },
  { id: "invest" as Intent, label: "Invest for returns", icon: <TrendingUp className="h-5 w-5" /> },
  { id: "holiday" as Intent, label: "Holiday / second home", icon: <Palmtree className="h-5 w-5" /> },
  { id: "rent" as Intent, label: "Rent a property", icon: <Key className="h-5 w-5" /> },
];

function IntentStep({
  value,
  onSelect,
}: {
  value: Intent | null;
  onSelect: (v: Intent) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-12">
      <p className="mb-1 text-sm font-medium text-muted-foreground">Step 1 of 5</p>
      <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">
        What brings you here today?
      </h2>
      <div className="mt-6 space-y-3">
        {INTENT_OPTIONS.map((opt) => (
          <QuizCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onSelect(opt.id)}
            label={opt.label}
            icon={opt.icon}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Market ─────────────────────────────────────────────────────────────

function MarketStep({
  value,
  onSelect,
}: {
  value: Market | null;
  onSelect: (v: Market) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-12">
      <p className="mb-1 text-sm font-medium text-muted-foreground">Step 2 of 5</p>
      <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">
        Which market interests you?
      </h2>
      <div className="mt-6 space-y-3">
        {MARKETS.map((mkt) => (
          <button
            key={mkt.id}
            onClick={() => onSelect(mkt.id)}
            className={cn(
              "group flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
              "min-h-[80px] cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              value === mkt.id
                ? "border-estate-700 bg-estate-700/5"
                : "border-border bg-white hover:border-estate-700/30 hover:shadow-md active:scale-[0.98]",
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <MarketIcon market={mkt.id} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{mkt.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{mkt.tagline}</p>
            </div>
            {value === mkt.id && <Check className="h-5 w-5 shrink-0 text-estate-700" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Property Type ──────────────────────────────────────────────────────

function PropertyTypeStep({
  market,
  value,
  onToggle,
  onNext,
}: {
  market: Market;
  value: string[];
  onToggle: (v: string) => void;
  onNext: () => void;
}) {
  const types = PROPERTY_TYPES[market];

  useEffect(() => {
    if (value.length > 0) {
      const t = setTimeout(onNext, 400);
      return () => clearTimeout(t);
    }
  }, [value.length, onNext]);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-12">
      <p className="mb-1 text-sm font-medium text-muted-foreground">Step 3 of 5</p>
      <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">
        What type of property?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Select all that apply</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {types.map((pt) => {
          const selected = value.includes(pt.id);
          return (
            <button
              key={pt.id}
              onClick={() => onToggle(pt.id)}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                "aspect-[4/3] cursor-pointer",
                selected
                  ? "border-estate-700"
                  : "border-transparent hover:border-estate-700/30",
              )}
            >
              <Image
                src={pt.imageSrc}
                alt={pt.label}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-end p-2 transition-colors duration-200",
                  selected ? "bg-estate-700/70" : "bg-gradient-to-t from-black/60 to-transparent",
                )}
              >
                <p className="text-sm font-semibold text-white">{pt.label}</p>
                {selected && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white">
                    <Check className="h-3.5 w-3.5 text-estate-700" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Location ────────────────────────────────────────────────────────

function LocationStep({
  market,
  value,
  onToggle,
  onNext,
}: {
  market: Market;
  value: string[];
  onToggle: (v: string) => void;
  onNext: () => void;
}) {
  const locations = AREAS[market];

  useEffect(() => {
    if (value.length > 0) {
      const t = setTimeout(onNext, 400);
      return () => clearTimeout(t);
    }
  }, [value.length, onNext]);

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-12">
      <p className="mb-1 text-sm font-medium text-muted-foreground">Step 4 of 5</p>
      <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">
        Which areas interest you?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Select up to 3</p>
      <div className="mt-6 space-y-3">
        {locations.map((loc) => {
          const selected = value.includes(loc.id);
          const atLimit = value.length >= 3 && !selected;
          return (
            <QuizCard
              key={loc.id}
              selected={selected}
              onClick={() => !atLimit && onToggle(loc.id)}
              label={loc.label}
              subtitle={loc.subtitle}
              icon={<MapPin className="h-5 w-5" />}
              multi
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 5: Budget ──────────────────────────────────────────────────────────

function BudgetStep({
  market,
  intent,
  value,
  onSelect,
}: {
  market: Market;
  intent: Intent | null;
  value: BudgetRange | null;
  onSelect: (v: BudgetRange) => void;
}) {
  const isRent = intent === "rent";
  const options = isRent
    ? BUDGET_RANGES[market].rent
    : BUDGET_RANGES[market].buy;

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-12">
      <p className="mb-1 text-sm font-medium text-muted-foreground">Step 5 of 5</p>
      <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">
        What's your {isRent ? "monthly rent" : "purchase"} budget?
      </h2>
      <div className="mt-6 flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={cn(
              "rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              value === opt.id
                ? "border-estate-700 bg-estate-700 text-white"
                : "border-border bg-white text-foreground hover:border-estate-700/40",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 6: Timeline ─────────────────────────────────────────────────────────

const TIMELINE_OPTIONS = [
  {
    id: "immediately" as Timeline,
    label: "Immediately",
    subtitle: "within 30 days",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    id: "1_3_months" as Timeline,
    label: "1 – 3 months",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "3_6_months" as Timeline,
    label: "3 – 6 months",
    icon: <Landmark className="h-5 w-5" />,
  },
  {
    id: "exploring" as Timeline,
    label: "Just exploring",
    icon: <Palmtree className="h-5 w-5" />,
  },
];

function TimelineStep({
  value,
  onSelect,
}: {
  value: Timeline | null;
  onSelect: (v: Timeline) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-12">
      <p className="mb-1 text-sm font-medium text-muted-foreground">Almost done</p>
      <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">
        When are you looking to move forward?
      </h2>
      <div className="mt-6 space-y-3">
        {TIMELINE_OPTIONS.map((opt) => (
          <QuizCard
            key={opt.id}
            selected={value === opt.id}
            onClick={() => onSelect(opt.id)}
            label={opt.label}
            subtitle={opt.subtitle}
            icon={opt.icon}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Lead Gate ────────────────────────────────────────────────────────────────

function LoadingScreen({ market }: { market: Market }) {
  const [done, setDone] = useReducer((v) => v + 1, 0);
  const signals = [
    `Checking ${TRUST_SIGNALS[market][0].replace(/\d+ /, "")}...`,
    "Filtering by your budget",
    "Curating your personalised shortlist",
  ];

  useEffect(() => {
    const timers = signals.map((_, i) => setTimeout(() => setDone(), 700 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3 justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-estate-700 border-t-transparent" />
          <span className="font-serif text-xl font-medium text-estate-700">
            Matching your preferences...
          </span>
        </div>
        <div className="mt-6 space-y-3">
          {signals.slice(0, done).map((step, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Check className="h-4 w-4 shrink-0 text-trust-teal" />
              {step}
            </div>
          ))}
          {signals.slice(done).map((step, i) => (
            <div
              key={`pending-${i}`}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground/40"
            >
              <div className="h-4 w-4 rounded-full border border-current" />
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeadGateForm({
  market,
  onSubmit,
  onBack,
  matchCount,
  isSubmitting,
  firstName,
  whatsapp,
  email,
  phone,
  onUpdate,
}: {
  market: Market;
  onSubmit: () => void;
  onBack: () => void;
  matchCount: number;
  isSubmitting: boolean;
  firstName: string;
  whatsapp: string;
  email: string;
  phone: string;
  onUpdate: (field: "firstName" | "whatsapp" | "email" | "phone", value: string) => void;
}) {
  const canSubmitName = firstName.trim().length > 0;
  const canSubmitPhone = phone.trim().length > 0 || whatsapp.trim().length > 0;
  const canSubmit = canSubmitName && canSubmitPhone;
  const isValidPhone = (v: string) => /^[\d\s+]{7,15}$/.test(v.replace(/\s/g, ""));
  const showWhatsApp = market === "dubai";
  const phoneValue = showWhatsApp ? whatsapp : phone;

  return (
    <div className="mx-auto w-full max-w-sm px-4 pt-12 text-center">
      <div className="mb-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-estate-700/10">
          <SlidersHorizontal className="h-6 w-6 text-estate-700" />
        </div>
        <h2 className="font-serif text-2xl font-medium md:text-3xl">
          Your matches are ready.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {matchCount > 0
            ? `We found ${matchCount} properties that match your criteria in ${market === "dubai" ? "Dubai" : market === "uk" ? "the UK" : "Bali"}.`
            : "Enter your details to see your personalised shortlist."}
        </p>
      </div>

      <div className="space-y-3 text-left">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            First Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={firstName}
            onChange={(e) => onUpdate("firstName", e.target.value)}
            placeholder="Your first name"
            className="h-12"
            autoComplete="given-name"
          />
        </div>

        {showWhatsApp ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              WhatsApp Number <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                +971
              </span>
              <Input
                value={whatsapp}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  onUpdate("whatsapp", v);
                }}
                placeholder="WhatsApp number"
                className="h-12 pl-14"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>
            {whatsapp.length > 0 && !isValidPhone(whatsapp) && (
              <p className="mt-1 text-xs text-destructive">Please enter a valid phone number</p>
            )}
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <Input
              value={phone}
              onChange={(e) => onUpdate("phone", e.target.value)}
              placeholder="+44 7700 900000"
              className="h-12"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            value={email}
            onChange={(e) => onUpdate("email", e.target.value)}
            placeholder="Email (optional)"
            className="h-12"
            type="email"
            autoComplete="email"
          />
        </div>

        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="h-12 w-full bg-estate-700 text-white hover:bg-estate-600 disabled:opacity-50"
          size="lg"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting...
            </div>
          ) : (
            <>
              See My Properties
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 flex items-start gap-2 text-left text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>Your details are private. No spam — our agents will reach out once with your personalised list.</p>
      </div>

      <button
        onClick={onBack}
        className="mt-4 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Go back
      </button>
    </div>
  );
}

// ─── Thank You ─────────────────────────────────────────────────────────────────

const MARKET_PREVIEW: Record<
  Market,
  { name: string; area: string; price: string }[]
> = {
  dubai: [
    { name: "Marina Gate Residences", area: "Dubai Marina", price: "AED 2,450,000" },
    { name: "Downtown Views Apartment", area: "Downtown Dubai", price: "AED 3,850,000" },
    { name: "Palm Jumeirah Villa", area: "Palm Jumeirah", price: "AED 18,500,000" },
  ],
  uk: [
    { name: "Canary Wharf Penthouse", area: "London", price: "£1,850,000" },
    { name: "Manchester City Apartment", area: "Manchester", price: "£485,000" },
    { name: "Edinburgh New Town Flat", area: "Edinburgh", price: "£725,000" },
  ],
  bali: [
    { name: "Canggu Modern Villa", area: "Canggu", price: "$380,000" },
    { name: "Ubud Ricefield Estate", area: "Ubud", price: "$650,000" },
    { name: "Uluwatu Cliff Villa", area: "Uluwatu", price: "$1,200,000" },
  ],
};

const MARKET_IMAGES: Record<Market, string[]> = {
  dubai: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=70",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=70",
  ],
  uk: [
    "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=600&q=70",
    "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=600&q=70",
    "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=600&q=70",
  ],
  bali: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=70",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=70",
  ],
};

function ThankYouSection({
  firstName,
  market,
}: {
  firstName: string;
  market: Market;
}) {
  const shareText = encodeURIComponent(
    `I just found my perfect property ${market === "dubai" ? "in Dubai" : market === "uk" ? "in the UK" : "in Bali"} — try this tool: https://haus.ae/match`,
  );
  const preview = MARKET_PREVIEW[market];
  const images = MARKET_IMAGES[market];

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-12 text-center">
      <div className="mb-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-trust-teal/10">
          <Check className="h-7 w-7 text-trust-teal" />
        </div>
        <h2 className="font-serif text-2xl font-medium md:text-3xl">
          You're in, {firstName}. 🎉
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your personalised shortlist is being prepared by our {market === "dubai" ? "Dubai" : market === "uk" ? "UK" : "Bali"} team. Expect a message within 2 hours.
        </p>
      </div>

      {/* Market badge */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <MarketIcon market={market} />
        <span className="text-sm font-medium text-foreground">
          {MARKETS.find((m) => m.id === market)?.label}
        </span>
      </div>

      {/* Preview cards */}
      <div className="space-y-3">
        <p className="text-left text-sm font-medium text-foreground">
          Here's a preview of what we found:
        </p>
        {preview.map((p, i) => (
          <div
            key={i}
            className={cn(
              "relative overflow-hidden rounded-xl border border-border bg-white text-left",
              i > 0 && "blur-sm",
            )}
          >
            <div className="relative h-36 w-full">
              <Image src={images[i]} alt={p.name} fill className="object-cover" />
              <Badge className="absolute left-2 top-2 bg-trust-teal/90 text-white backdrop-blur-sm border-0">
                <BadgeCheck className="mr-0.5 h-3 w-3" />
                Verified
              </Badge>
            </div>
            <div className="p-3">
              <p className="font-medium text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.area}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-serif text-base font-semibold text-estate-700">
                  {p.price}
                </span>
              </div>
            </div>
            {i > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <p className="px-4 text-sm font-medium text-foreground/60">
                  Unlock your full shortlist — check your {market === "dubai" ? "WhatsApp" : "messages"}.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <Button
          asChild
          variant="outline"
          className="h-11 w-full border-estate-700 bg-transparent text-estate-700 hover:bg-estate-700/5"
        >
          <Link href="/search">
            Browse all properties while you wait
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-11 w-full text-muted-foreground"
        >
          <Link
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share with someone who's also looking
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MatchPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToTop();
  }, [state.step, scrollToTop]);

  const handleSubmit = async () => {
    dispatch({ type: "SUBMIT_START" });
    try {
      await fetch("/api/funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: state.intent,
          market: state.market,
          propertyTypes: state.propertyTypes,
          areas: state.areas,
          budget: state.budget,
          timeline: state.timeline,
          firstName: state.firstName,
          whatsapp: state.whatsapp,
          phone: state.phone,
          email: state.email,
        }),
      });
    } catch (_) {
      // graceful failure — still show thank you
    }
    const count = Math.floor(Math.random() * 8) + 4;
    dispatch({ type: "SUBMIT_SUCCESS", payload: count });
  };

  // Transition copy after each step
  const TRANSITIONS: Partial<Record<number, string>> = {
    1: "Great. Let's find the right fit.",
    2: "Good. Now let's narrow it down.",
    3: "Good taste. Almost there.",
    4: "Last one — almost done.",
  };

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Progress bar — show during quiz (steps 1-6) */}
      {state.step > 0 && state.step < 7 && (
        <ProgressBar step={state.step} total={6} />
      )}

      {/* ── Hero ── */}
      {state.step === 0 && (
        <HeroSection onStart={() => dispatch({ type: "START" })} />
      )}

      {/* ── Step 1: Intent ── */}
      {state.step === 1 && (
        <div className="relative min-h-screen pt-16 pb-8">
          <BackButton onClick={() => dispatch({ type: "BACK" })} />
          <IntentStep
            value={state.intent}
            onSelect={(v) => dispatch({ type: "SET_INTENT", payload: v })}
          />
          {state.intent && TRANSITIONS[1] && (
            <p className="mx-auto mt-6 max-w-md px-4 text-center text-sm italic text-muted-foreground">
              {TRANSITIONS[1]}
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Market ── */}
      {state.step === 2 && (
        <div className="relative min-h-screen pt-16 pb-8">
          <BackButton onClick={() => dispatch({ type: "BACK" })} />
          <MarketStep
            value={state.market}
            onSelect={(v) => dispatch({ type: "SET_MARKET", payload: v })}
          />
          {state.market && TRANSITIONS[2] && (
            <p className="mx-auto mt-6 max-w-md px-4 text-center text-sm italic text-muted-foreground">
              {TRANSITIONS[2]}
            </p>
          )}
        </div>
      )}

      {/* ── Step 3: Property Type ── */}
      {state.step === 3 && state.market && (
        <div className="relative min-h-screen pt-16 pb-8">
          <BackButton onClick={() => dispatch({ type: "BACK" })} />
          <PropertyTypeStep
            market={state.market}
            value={state.propertyTypes}
            onToggle={(v) => dispatch({ type: "TOGGLE_PROPERTY_TYPE", payload: v })}
            onNext={() => dispatch({ type: "NEXT" })}
          />
          {state.propertyTypes.length > 0 && TRANSITIONS[3] && (
            <p className="mx-auto mt-6 max-w-lg px-4 text-center text-sm italic text-muted-foreground">
              {TRANSITIONS[3]}
            </p>
          )}
        </div>
      )}

      {/* ── Step 4: Location ── */}
      {state.step === 4 && state.market && (
        <div className="relative min-h-screen pt-16 pb-8">
          <BackButton onClick={() => dispatch({ type: "BACK" })} />
          <LocationStep
            market={state.market}
            value={state.areas}
            onToggle={(v) => dispatch({ type: "TOGGLE_AREA", payload: v })}
            onNext={() => dispatch({ type: "NEXT" })}
          />
          {state.areas.length > 0 && TRANSITIONS[4] && (
            <p className="mx-auto mt-6 max-w-md px-4 text-center text-sm italic text-muted-foreground">
              {TRANSITIONS[4]}
            </p>
          )}
        </div>
      )}

      {/* ── Step 5: Budget ── */}
      {state.step === 5 && state.market && (
        <div className="relative min-h-screen pt-16 pb-8">
          <BackButton onClick={() => dispatch({ type: "BACK" })} />
          <BudgetStep
            market={state.market}
            intent={state.intent}
            value={state.budget}
            onSelect={(v) => dispatch({ type: "SET_BUDGET", payload: v })}
          />
        </div>
      )}

      {/* ── Step 6: Timeline ── */}
      {state.step === 6 && state.market && (
        <div className="relative min-h-screen pt-16 pb-8">
          <BackButton onClick={() => dispatch({ type: "BACK" })} />
          <TimelineStep
            value={state.timeline}
            onSelect={(v) => dispatch({ type: "SET_TIMELINE", payload: v })}
          />
        </div>
      )}

      {/* ── Lead Gate ── */}
      {state.step === 7 && state.market && (() => {
        const mkt = state.market;
        return (
          <div className="min-h-screen pt-16 pb-8">
            <LoadingScreen market={mkt} />
            <div className="mt-6">
              <LeadGateForm
                market={mkt}
                onSubmit={handleSubmit}
                onBack={() => dispatch({ type: "BACK" })}
                matchCount={0}
                isSubmitting={state.isSubmitting}
                firstName={state.firstName}
                whatsapp={state.whatsapp}
                phone={state.phone}
                email={state.email}
                onUpdate={(field, value) =>
                  dispatch({ type: "UPDATE_FIELD", payload: { field, value } })
                }
              />
            </div>
          </div>
        );
      })()}

      {/* ── Thank You ── */}
      {state.step === 8 && state.market && (() => {
        const mkt = state.market;
        return (
          <div className="min-h-screen pt-16 pb-24">
            <ThankYouSection firstName={state.firstName} market={mkt} />
          </div>
        );
      })()}
    </div>
  );
}
