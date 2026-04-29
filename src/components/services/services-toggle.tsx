"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Home,
  TrendingUp as InvestIcon,
  Building2,
  Key,
  Tag,
  MapPin,
  Maximize2,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Shield,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Intent = "buy" | "rent" | "sell" | "list";
type Step = 1 | 2 | 3 | 4;

interface BuyFormData {
  intent: Intent;
  useType: "" | "personal" | "investment";
  buyRent: "" | "buy" | "rent";
  locations: string[];
  bedrooms: "" | "1" | "2" | "3" | "4" | "5+";
  propertyType: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  name: string;
  email: string;
  mobile: string;
  contactMethod: "" | "phone" | "whatsapp" | "email";
  bestTime: string;
  notes: string;
}

interface SellFormData {
  intent: Intent;
  sellRent: "" | "sell" | "list";
  locations: string[];
  bedrooms: "" | "1" | "2" | "3" | "4" | "5+";
  propertyType: string;
  size: string;
  currentValue: string;
  ownership: "" | "freehold" | "leasehold" | "not-sure";
  status: "" | "vacant" | "tenanted" | "owner-occupied";
  timeline: "" | "immediately" | "1-3months" | "3-6months" | "6+months";
  name: string;
  email: string;
  mobile: string;
  contactMethod: "" | "phone" | "whatsapp" | "email";
  notes: string;
}

const LOCATIONS = [
  // UK — primary market
  { value: "uk-london", label: "London", country: "UK" },
  { value: "uk-cardiff", label: "Cardiff", country: "UK" },
  { value: "uk-manchester", label: "Manchester", country: "UK" },
  { value: "uk-birmingham", label: "Birmingham", country: "UK" },
  { value: "uk-edinburgh", label: "Edinburgh", country: "UK" },
  { value: "uk-other", label: "Other UK city", country: "UK" },
  // UAE
  { value: "uae-dubai-marina", label: "Dubai Marina", country: "UAE" },
  { value: "uae-dubai-downtown", label: "Downtown Dubai", country: "UAE" },
  { value: "uae-dubai-palm", label: "Palm Jumeirah", country: "UAE" },
  { value: "uae-dubai-creek", label: "Dubai Creek Harbour", country: "UAE" },
  { value: "uae-dubai-jvc", label: "JVC", country: "UAE" },
  { value: "uae-abu-dhabi", label: "Abu Dhabi", country: "UAE" },
  // Indonesia
  { value: "id-bali-canggu", label: "Bali — Canggu", country: "Indonesia" },
  { value: "id-bali-ubud", label: "Bali — Ubud", country: "Indonesia" },
  { value: "id-bali-seminyak", label: "Bali — Seminyak", country: "Indonesia" },
  // Catch-all
  { value: "other", label: "Other / Not sure", country: "Other" },
];

type Currency = "GBP" | "AED" | "USD";

function inferCurrency(locations: string[]): Currency {
  if (locations.length === 0) return "GBP";
  const allUK = locations.every((l) => l.startsWith("uk-"));
  if (allUK) return "GBP";
  const allUAE = locations.every((l) => l.startsWith("uae-"));
  if (allUAE) return "AED";
  return "USD";
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "villa", label: "Villa", icon: Home },
  { value: "penthouse", label: "Penthouse", icon: Building2 },
  { value: "townhouse", label: "Townhouse", icon: Home },
  { value: "commercial", label: "Commercial", icon: Building2 },
  { value: "land", label: "Land / Plot", icon: MapPin },
];

const BUDGET_RANGES_BUY: Record<Currency, { min: string; max: string; label: string }[]> = {
  GBP: [
    { min: "", max: "250000", label: "Under £250K" },
    { min: "250000", max: "500000", label: "£250K – £500K" },
    { min: "500000", max: "1000000", label: "£500K – £1M" },
    { min: "1000000", max: "2500000", label: "£1M – £2.5M" },
    { min: "2500000", max: "", label: "£2.5M+" },
  ],
  AED: [
    { min: "", max: "750000", label: "Under AED 750K" },
    { min: "750000", max: "1800000", label: "AED 750K – 1.8M" },
    { min: "1800000", max: "3700000", label: "AED 1.8M – 3.7M" },
    { min: "3700000", max: "9000000", label: "AED 3.7M – 9M" },
    { min: "9000000", max: "", label: "AED 9M+" },
  ],
  USD: [
    { min: "", max: "200000", label: "Under $200K" },
    { min: "200000", max: "500000", label: "$200K – $500K" },
    { min: "500000", max: "1000000", label: "$500K – $1M" },
    { min: "1000000", max: "2000000", label: "$1M – $2M" },
    { min: "2000000", max: "", label: "$2M+" },
  ],
};

const BUDGET_RANGES_RENT: Record<Currency, { min: string; max: string; label: string }[]> = {
  GBP: [
    { min: "", max: "1500", label: "Under £1,500 pcm" },
    { min: "1500", max: "3000", label: "£1,500 – £3,000 pcm" },
    { min: "3000", max: "6000", label: "£3,000 – £6,000 pcm" },
    { min: "6000", max: "12000", label: "£6,000 – £12,000 pcm" },
    { min: "12000", max: "", label: "£12,000+ pcm" },
  ],
  AED: [
    { min: "", max: "60000", label: "Under AED 60K/yr" },
    { min: "60000", max: "150000", label: "AED 60K – 150K/yr" },
    { min: "150000", max: "300000", label: "AED 150K – 300K/yr" },
    { min: "300000", max: "600000", label: "AED 300K – 600K/yr" },
    { min: "600000", max: "", label: "AED 600K+/yr" },
  ],
  USD: [
    { min: "", max: "5000", label: "Under $5K/yr" },
    { min: "5000", max: "15000", label: "$5K – $15K/yr" },
    { min: "15000", max: "35000", label: "$15K – $35K/yr" },
    { min: "35000", max: "75000", label: "$35K – $75K/yr" },
    { min: "75000", max: "", label: "$75K+/yr" },
  ],
};

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3months", label: "Within 1–3 months" },
  { value: "3-6months", label: "Within 3–6 months" },
  { value: "6-12months", label: "6–12 months" },
  { value: "just-exploring", label: "Just exploring" },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center" style={{ flex: i < total - 1 ? 1 : "none" }}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                  i + 1 < current
                    ? "bg-estate-700 text-white"
                    : i + 1 === current
                    ? "bg-estate-700 text-white shadow-md shadow-estate-700/30"
                    : "border-2 border-border bg-surface text-muted-foreground"
                )}
              >
                {i + 1 < current ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-xs font-medium transition-colors duration-300 hidden sm:block",
                  i + 1 === current ? "text-estate-700" : "text-muted-foreground"
                )}
              >
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-all duration-500",
                  i + 1 < current ? "bg-estate-700" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Selection Pill ───────────────────────────────────────────────────────────

function SelectionPill({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200",
        selected
          ? "border-estate-700 bg-estate-700/8 text-estate-700 shadow-sm"
          : "border-border bg-surface text-muted-foreground hover:border-estate-700/30 hover:text-foreground",
        className
      )}
      style={selected ? { transform: "scale(1.02)" } : {}}
    >
      {children}
    </button>
  );
}

// ─── Multi-Select ────────────────────────────────────────────────────────────

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  columns = 2,
  max = 3,
}: {
  label: string;
  options: { value: string; label: string; country?: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
  columns?: number;
  max?: number;
}) {
  const atLimit = selected.length >= max;
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else if (selected.length < max) {
      onChange([...selected, val]);
    }
  };

  return (
    <div>
      <p className="mb-2.5 text-sm font-medium text-foreground">
        {label}{" "}
        <span className="text-xs text-muted-foreground font-normal">
          (select up to {max}
          {atLimit ? " — limit reached" : ""})
        </span>
      </p>
      <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const disabled = !isSelected && atLimit;
          return (
            <SelectionPill
              key={opt.value}
              selected={isSelected}
              onClick={() => !disabled && toggle(opt.value)}
              className={disabled ? "opacity-40 cursor-not-allowed hover:border-border hover:text-muted-foreground" : ""}
            >
              <span className="flex items-center gap-1.5">
                {opt.country && (
                  <span className="text-xs opacity-60">{opt.country}</span>
                )}
                {opt.label}
              </span>
            </SelectionPill>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selected.map((s) => {
            const opt = options.find((o) => o.value === s);
            return (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-estate-700/10 px-2 py-0.5 text-xs text-estate-700"
              >
                {opt?.label}
                <button onClick={() => toggle(s)} className="ml-0.5 hover:text-estate-600">×</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FloatingInput ────────────────────────────────────────────────────────────

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  icon: Icon,
  suffix,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  icon?: React.ElementType;
  suffix?: string;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      <div
        className={cn(
          "relative rounded-xl border-2 bg-surface transition-all duration-200",
          error
            ? "border-destructive/50"
            : focused
            ? "border-estate-700/50 shadow-sm shadow-estate-700/10"
            : "border-border hover:border-estate-700/20"
        )}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            "peer w-full rounded-xl bg-transparent px-4 pt-5 pb-2 text-sm text-foreground placeholder:text-transparent focus:outline-none",
            Icon && "pl-10"
          )}
          placeholder={label}
        />
        {Icon && (
          <Icon
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
              focused ? "text-estate-700" : "text-muted-foreground"
            )}
          />
        )}
        <label
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 pointer-events-none",
            Icon && "left-10",
            (focused || hasValue)
              ? "-top-1 translate-y-0 text-xs bg-surface px-1 text-estate-700 font-medium"
              : "text-muted-foreground"
          )}
        >
          {label}{required && " *"}
        </label>
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
        {value && !error && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-trust-teal" />
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-estate-700 transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({
  intent,
  name,
}: {
  intent: "buy" | "rent" | "sell" | "list";
  name: string;
}) {
  const messages = {
    buy: {
      title: `Thank you, ${name.split(" ")[0]}. Your enquiry is in.`,
      subtitle:
        "One of our specialist advisors will review your brief and introduce you to vetted estate agents who match your criteria — no spam, no obligation.",
      cta: "Speak to an Advisor",
      icon: <Home className="h-8 w-8 text-estate-700" />,
    },
    rent: {
      title: `You're all set, ${name.split(" ")[0]}.`,
      subtitle:
        "Our team will introduce you to letting agents in your chosen areas and arrange viewings at your convenience.",
      cta: "Speak to an Advisor",
      icon: <Key className="h-8 w-8 text-estate-700" />,
    },
    sell: {
      title: `Thank you, ${name.split(" ")[0]}. Your valuation request is in.`,
      subtitle:
        "Our network of vetted estate agents will prepare a comparative market analysis and reach out within 2 working hours.",
      cta: "Speak to an Advisor",
      icon: <Tag className="h-8 w-8 text-estate-700" />,
    },
    list: {
      title: `Received, ${name.split(" ")[0]}. Your letting brief is on its way.`,
      subtitle:
        "We'll match you with vetted letting agents in your area — expect to hear from a partner agent within 48 hours.",
      cta: "Speak to an Advisor",
      icon: <Calendar className="h-8 w-8 text-estate-700" />,
    },
  };

  const msg = messages[intent];

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-estate-700/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-estate-700/10">
          {msg.icon}
        </div>
      </div>
      <h3 className="font-serif text-2xl font-medium text-estate-700">{msg.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{msg.subtitle}</p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-left">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What happens next
        </p>
        <ul className="space-y-2">
          {[
            "Advisor reviews your enquiry within 2 working hours",
            intent === "buy" || intent === "rent"
              ? "Vetted estate agents introduced for your shortlist"
              : "Comparative market analysis emailed to you",
            "Personalised video call arranged at your convenience",
            intent === "sell" || intent === "list"
              ? "Letting / sales brief sent to partner agents"
              : "Property viewings arranged with your chosen agent",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-trust-teal" />
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <BadgeCheck className="h-4 w-4 text-trust-teal" />
        Your data is secure and never shared without consent.
      </div>

      <Button
        onClick={() => (window.location.href = "/")}
        className="mt-6 bg-estate-700 text-white hover:bg-estate-600"
      >
        {msg.cta} <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Trust Badges ─────────────────────────────────────────────────────────────

function TrustBadges() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
      {[
        { icon: Shield, text: "RERA & FCA-Regulated" },
        { icon: BadgeCheck, text: "15+ Years Experience" },
        { icon: Clock, text: "24/7 Support" },
      ].map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="h-4 w-4 text-estate-700" />
          {text}
        </div>
      ))}
    </div>
  );
}

// ─── Intent Selector ──────────────────────────────────────────────────────────

function IntentSelector({
  onSelect,
}: {
  onSelect: (intent: Intent) => void;
}) {
  const intents = [
    {
      id: "buy" as Intent,
      icon: Home,
      title: "Looking to Buy",
      desc: "Find your perfect property investment",
      color: "estate-700",
      badge: "Most popular",
    },
    {
      id: "rent" as Intent,
      icon: Key,
      title: "Looking to Rent",
      desc: "Rent your next home or commercial space",
      color: "trust-teal",
    },
    {
      id: "sell" as Intent,
      icon: Tag,
      title: "Looking to Sell",
      desc: "Get the best price for your property",
      color: "action-amber",
    },
    {
      id: "list" as Intent,
      icon: Calendar,
      title: "Looking to Let",
      desc: "Match with a vetted letting agent",
      color: "copper-clay",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 text-center">
        <p className="mb-1 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
          What we offer
        </p>
        <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
          How can we help you today?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your goal and we'll guide you through the rest — takes less than 2 minutes.
        </p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-estate-700 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-estate-700" />
          </span>
          Join 1,247 people we've matched with vetted agents this month
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {intents.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="group flex flex-col gap-3 rounded-2xl border-2 border-border bg-surface p-5 text-left transition-all duration-300 hover:border-estate-700/40 hover:shadow-md hover:shadow-estate-700/5"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{
                backgroundColor:
                  item.id === "buy"
                    ? "rgba(31, 79, 47, 0.1)"
                    : item.id === "rent"
                    ? "rgba(47, 122, 115, 0.1)"
                    : item.id === "sell"
                    ? "rgba(193, 138, 45, 0.1)"
                    : "rgba(176, 125, 99, 0.1)",
              }}
            >
              <item.icon
                className="h-5 w-5"
                style={{
                  color:
                    item.id === "buy"
                      ? "#1f4f2f"
                      : item.id === "rent"
                      ? "#2f7a73"
                      : item.id === "sell"
                      ? "#c18a2d"
                      : "#b07d63",
                }}
              />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="font-serif text-sm font-semibold text-estate-700 leading-tight">{item.title}</p>
                {item.badge && (
                  <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-xs font-semibold text-gold-600">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <TrustBadges />
    </div>
  );
}

// ─── Buyer/Renter Flow ───────────────────────────────────────────────────────

function BuyRentForm({ intent, onComplete, onBack }: { intent: "buy" | "rent"; onComplete: (name: string) => void; onBack: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<BuyFormData>({
    intent,
    useType: "",
    buyRent: intent,
    locations: [],
    bedrooms: "",
    propertyType: "",
    budgetMin: "",
    budgetMax: "",
    timeline: "",
    name: "",
    email: "",
    mobile: "",
    contactMethod: "",
    bestTime: "",
    notes: "",
  });

  const set = <K extends keyof BuyFormData>(key: K, val: BuyFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const stepLabels = ["Your Goal", "Property", "Budget & Timeline", "Contact"];

  const requiresBedrooms = !["land", "commercial"].includes(form.propertyType);
  const currency = inferCurrency(form.locations);
  const budgetRanges =
    form.buyRent === "buy" ? BUDGET_RANGES_BUY[currency] : BUDGET_RANGES_RENT[currency];
  const hasBudget = Boolean(form.budgetMin || form.budgetMax);

  const step2Complete =
    form.locations.length > 0 && form.propertyType && (!requiresBedrooms || form.bedrooms);

  const stepProgress = {
    1: form.useType ? 100 : 0,
    2: step2Complete ? 100 : 0,
    3: hasBudget && form.timeline && form.contactMethod ? 100 : 0,
    4: form.name && form.email && form.mobile ? 100 : 0,
  };

  const canAdvance =
    (step === 1 && form.useType) ||
    (step === 2 && step2Complete) ||
    (step === 3 && hasBudget && form.timeline && form.contactMethod) ||
    (step === 4 && form.name && form.email && form.mobile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(form.name);
  };

  const submitLabel =
    intent === "rent"
      ? form.useType === "investment"
        ? "Get My Corporate Let Brief"
        : "Find My Rental"
      : form.useType === "investment"
      ? "Get My Investment Brief"
      : "Find My Property";

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3 w-3" /> Change intent
      </button>

      <StepIndicator
        current={step}
        total={4}
        labels={stepLabels}
      />
      <ProgressBar value={stepProgress[step]} />

      {/* Step 1: Goal */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <p className="mb-1 text-sm font-semibold text-foreground">
              {intent === "rent"
                ? "Is this for personal living or a corporate / relocation let?"
                : "Are you buying for personal use or investment?"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => set("useType", "personal")}
                className={cn(
                  "rounded-xl border-2 p-4 text-center transition-all",
                  form.useType === "personal"
                    ? "border-estate-700 bg-estate-700/8"
                    : "border-border hover:border-estate-700/30"
                )}
              >
                <Home className="mx-auto mb-2 h-6 w-6 text-estate-700" />
                <p className="text-sm font-semibold text-estate-700">Personal Use</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Home for you &amp; family</p>
              </button>
              <button
                onClick={() => set("useType", "investment")}
                className={cn(
                  "rounded-xl border-2 p-4 text-center transition-all",
                  form.useType === "investment"
                    ? "border-estate-700 bg-estate-700/8"
                    : "border-border hover:border-estate-700/30"
                )}
              >
                <InvestIcon className="mx-auto mb-2 h-6 w-6 text-estate-700" />
                <p className="text-sm font-semibold text-estate-700">
                  {intent === "rent" ? "Corporate / Relocation" : "Investment"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {intent === "rent"
                    ? "Managed lets &amp; relocations"
                    : "Rental yield &amp; appreciation"}
                </p>
              </button>
            </div>
          </div>

          {form.useType && (
            <div className="rounded-xl bg-estate-700/5 border border-estate-700/20 p-4">
              <p className="flex items-center gap-2 text-sm text-estate-700 font-medium">
                <Sparkles className="h-4 w-4" />
                {intent === "rent"
                  ? form.useType === "investment"
                    ? "We manage corporate lets and relocations across London, Manchester and Dubai with vetted partner agents."
                    : "Our advisors curate fully-vetted rentals across the UK, UAE and Bali — no hidden fees to renters."
                  : form.useType === "investment"
                  ? "Investment clients typically see 4–6% net yields in prime UK cities and 6–10% in Dubai's growth corridors."
                  : "Personal buyers get curated off-market introductions in London, Cardiff, Manchester and prime Dubai districts."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Property */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <MultiSelect
            label="Preferred locations"
            options={LOCATIONS}
            selected={form.locations}
            onChange={(v) => {
              set("locations", v);
              // Reset bedrooms if user removed all locations or budget no longer matches
            }}
          />

          <div>
            <p className="mb-2.5 text-sm font-medium text-foreground">Property type</p>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    set("propertyType", t.value);
                    if (["land", "commercial"].includes(t.value)) {
                      set("bedrooms", "");
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all",
                    form.propertyType === t.value
                      ? "border-estate-700 bg-estate-700/8"
                      : "border-border hover:border-estate-700/30"
                  )}
                >
                  <t.icon className={cn("h-5 w-5", form.propertyType === t.value ? "text-estate-700" : "text-muted-foreground")} />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {requiresBedrooms && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Bedrooms</p>
              <div className="flex gap-2">
                {["1", "2", "3", "4", "5+"].map((b) => (
                  <SelectionPill
                    key={b}
                    selected={form.bedrooms === b}
                    onClick={() => set("bedrooms", b as BuyFormData["bedrooms"])}
                    className="flex-1 py-3"
                  >
                    {b}
                  </SelectionPill>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Budget */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {form.buyRent === "buy"
                ? `Budget range (${currency})`
                : currency === "GBP"
                ? "Monthly rent budget (GBP)"
                : `Annual rent budget (${currency})`}
            </p>
            <div className="grid gap-2">
              {budgetRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    set("budgetMin", range.min);
                    set("budgetMax", range.max);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                    form.budgetMin === range.min && form.budgetMax === range.max
                      ? "border-estate-700 bg-estate-700/8"
                      : "border-border hover:border-estate-700/30"
                  )}
                >
                  <span className="text-sm font-medium">{range.label}</span>
                  {form.budgetMin === range.min && form.budgetMax === range.max && (
                    <Check className="h-4 w-4 text-estate-700" />
                  )}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Currency derived from your selected locations. Final pricing confirmed by your advisor.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">When are you looking to {form.buyRent}?</p>
            <div className="grid grid-cols-2 gap-2">
              {TIMELINE_OPTIONS.map((t) => (
                <SelectionPill
                  key={t.value}
                  selected={form.timeline === t.value}
                  onClick={() => set("timeline", t.value)}
                  className="justify-start"
                >
                  {t.label}
                </SelectionPill>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Preferred contact method</p>
            <div className="flex gap-2">
              {[
                { id: "phone" as const, icon: Phone, label: "Phone Call" },
                { id: "whatsapp" as const, icon: MessageSquare, label: "WhatsApp" },
                { id: "email" as const, icon: Mail, label: "Email" },
              ].map((m) => (
                <SelectionPill
                  key={m.id}
                  selected={form.contactMethod === m.id}
                  onClick={() => set("contactMethod", m.id)}
                  className="flex-1 justify-center"
                >
                  <m.icon className="mr-1 h-3.5 w-3.5" />
                  {m.label}
                </SelectionPill>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Best time to reach you</p>
            <select
              value={form.bestTime}
              onChange={(e) => set("bestTime", e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-sm focus:border-estate-700/50 focus:outline-none focus:ring-2 focus:ring-estate-700/10"
            >
              <option value="">Select a time</option>
              <option value="morning">Mornings (9AM – 12PM)</option>
              <option value="afternoon">Afternoons (12PM – 5PM)</option>
              <option value="evening">Evenings (5PM – 8PM)</option>
              <option value="anytime">Anytime</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 4: Contact */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
          <div className="rounded-xl bg-estate-700/5 border border-estate-700/20 p-4">
            <p className="flex items-center gap-2 text-sm text-estate-700 font-medium">
              <BadgeCheck className="h-4 w-4" />
              Your enquiry is 100% free and without obligation
            </p>
          </div>

          <FloatingInput
            label="Full name"
            value={form.name}
            onChange={(v) => set("name", v)}
            required
            icon={Home}
          />
          <FloatingInput
            label="Email address"
            value={form.email}
            onChange={(v) => set("email", v)}
            type="email"
            required
            icon={Mail}
          />
          <FloatingInput
            label="Mobile / WhatsApp number (incl. country code, e.g. +44)"
            value={form.mobile}
            onChange={(v) => set("mobile", v.replace(/[^\d+]/g, ""))}
            type="tel"
            required
            icon={Phone}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Additional notes (optional)</p>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any specific requirements, questions, or preferences..."
              rows={3}
              className="w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-estate-700/50 focus:outline-none focus:ring-2 focus:ring-estate-700/10 resize-none"
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full bg-estate-700 text-white hover:bg-estate-600 shadow-md shadow-estate-700/20"
          >
            {submitLabel}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>

          <TrustBadges />
        </form>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex-1"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          )}
          <Button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canAdvance}
            className={cn("flex-1 bg-estate-700 text-white hover:bg-estate-600", step === 1 && "flex-1")}
          >
            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Seller/Landlord Flow ─────────────────────────────────────────────────────

function SellRentForm({ intent, onComplete, onBack }: { intent: "sell" | "list"; onComplete: (name: string) => void; onBack: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<SellFormData>({
    intent,
    sellRent: intent,
    locations: [],
    bedrooms: "",
    propertyType: "",
    size: "",
    currentValue: "",
    ownership: "",
    status: "",
    timeline: "",
    name: "",
    email: "",
    mobile: "",
    contactMethod: "",
    notes: "",
  });

  const set = <K extends keyof SellFormData>(key: K, val: SellFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const stepLabels = ["Property", "Value", "Timeline", "Contact"];

  const requiresBedrooms = !["land", "commercial"].includes(form.propertyType);
  const currency = inferCurrency(form.locations);
  const valueSymbol = currency === "GBP" ? "£" : currency === "AED" ? "AED " : "$";

  const step1Complete =
    form.locations.length > 0 && form.propertyType && (!requiresBedrooms || form.bedrooms);

  const stepProgress = {
    1: step1Complete ? 100 : 0,
    2: form.currentValue || form.size ? 100 : 0,
    3: form.timeline && form.status && form.ownership ? 100 : 0,
    4: form.name && form.email && form.mobile ? 100 : 0,
  };

  const canAdvance =
    (step === 1 && step1Complete) ||
    (step === 2 && (form.currentValue || form.size)) ||
    (step === 3 && form.timeline && form.status && form.ownership) ||
    (step === 4 && form.name && form.email && form.mobile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(form.name);
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3 w-3" /> Change intent
      </button>

      <StepIndicator
        current={step}
        total={4}
        labels={stepLabels}
      />
      <ProgressBar value={stepProgress[step]} />

      {/* Step 1: Property Details */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <MultiSelect
            label="Property location(s)"
            options={LOCATIONS}
            selected={form.locations}
            onChange={(v) => set("locations", v)}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Property type</p>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    set("propertyType", t.value);
                    if (["land", "commercial"].includes(t.value)) {
                      set("bedrooms", "");
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all",
                    form.propertyType === t.value
                      ? "border-estate-700 bg-estate-700/8"
                      : "border-border hover:border-estate-700/30"
                  )}
                >
                  <t.icon className={cn("h-5 w-5", form.propertyType === t.value ? "text-estate-700" : "text-muted-foreground")} />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {requiresBedrooms && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Bedrooms</p>
              <div className="flex gap-2">
                {["1", "2", "3", "4", "5+"].map((b) => (
                  <SelectionPill
                    key={b}
                    selected={form.bedrooms === b}
                    onClick={() => set("bedrooms", b as SellFormData["bedrooms"])}
                    className="flex-1 py-3"
                  >
                    {b}
                  </SelectionPill>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Value */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <FloatingInput
            label={
              form.sellRent === "sell"
                ? `Estimated value (${currency})`
                : currency === "GBP"
                ? "Monthly rent expectation (GBP)"
                : `Monthly rent expectation (${currency})`
            }
            value={form.currentValue}
            onChange={(v) => set("currentValue", v.replace(/\D/g, ""))}
            icon={Tag}
            suffix={form.sellRent === "sell" ? currency : `${currency}/mo`}
          />

          <FloatingInput
            label="Property size (sqft)"
            value={form.size}
            onChange={(v) => set("size", v.replace(/\D/g, ""))}
            icon={Maximize2}
            suffix="sqft"
          />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Ownership type</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "freehold" as const, label: "Freehold" },
                { value: "leasehold" as const, label: "Leasehold" },
                { value: "not-sure" as const, label: "Not sure" },
              ].map((o) => (
                <SelectionPill
                  key={o.value}
                  selected={form.ownership === o.value}
                  onClick={() => set("ownership", o.value)}
                  className="justify-center text-center"
                >
                  {o.label}
                </SelectionPill>
              ))}
            </div>
          </div>

          {form.currentValue && (
            <div className="rounded-xl bg-action-amber/10 border border-action-amber/20 p-4">
              <p className="text-sm text-action-amber font-medium">
                Based on your estimate of {valueSymbol}{parseInt(form.currentValue).toLocaleString()}, our average time to secure a buyer is <strong>21 days</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Timeline */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Property status</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "vacant" as const, label: "Vacant", desc: "Empty & ready" },
                { value: "tenanted" as const, label: "Tenanted", desc: "Currently rented" },
                { value: "owner-occupied" as const, label: "Owner Occupied", desc: "You live there" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => set("status", s.value)}
                  className={cn(
                    "rounded-xl border-2 p-3 text-center transition-all",
                    form.status === s.value
                      ? "border-estate-700 bg-estate-700/8"
                      : "border-border hover:border-estate-700/30"
                  )}
                >
                  <p className="text-sm font-semibold text-estate-700">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              When do you want to {form.sellRent}?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "immediately" as const, label: "Immediately" },
                { value: "1-3months" as const, label: "1–3 months" },
                { value: "3-6months" as const, label: "3–6 months" },
                { value: "6+months" as const, label: "6+ months" },
              ].map((t) => (
                <SelectionPill
                  key={t.value}
                  selected={form.timeline === t.value}
                  onClick={() => set("timeline", t.value)}
                  className="justify-start"
                >
                  {t.label}
                </SelectionPill>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Preferred contact method</p>
            <div className="flex gap-2">
              {[
                { id: "phone" as const, icon: Phone, label: "Phone" },
                { id: "whatsapp" as const, icon: MessageSquare, label: "WhatsApp" },
                { id: "email" as const, icon: Mail, label: "Email" },
              ].map((m) => (
                <SelectionPill
                  key={m.id}
                  selected={form.contactMethod === m.id}
                  onClick={() => set("contactMethod", m.id)}
                  className="flex-1 justify-center"
                >
                  <m.icon className="mr-1 h-3.5 w-3.5" />
                  {m.label}
                </SelectionPill>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Contact */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
          <div className="rounded-xl bg-estate-700/5 border border-estate-700/20 p-4">
            <p className="flex items-center gap-2 text-sm text-estate-700 font-medium">
              <BadgeCheck className="h-4 w-4" />
              Free valuation — no obligation, no spam
            </p>
          </div>

          <FloatingInput
            label="Full name"
            value={form.name}
            onChange={(v) => set("name", v)}
            required
            icon={Home}
          />
          <FloatingInput
            label="Email address"
            value={form.email}
            onChange={(v) => set("email", v)}
            type="email"
            required
            icon={Mail}
          />
          <FloatingInput
            label="Mobile / WhatsApp number (incl. country code, e.g. +44)"
            value={form.mobile}
            onChange={(v) => set("mobile", v.replace(/[^\d+]/g, ""))}
            type="tel"
            required
            icon={Phone}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Additional notes (optional)</p>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any context about your property or timeline..."
              rows={3}
              className="w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-estate-700/50 focus:outline-none focus:ring-2 focus:ring-estate-700/10 resize-none"
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full bg-estate-700 text-white hover:bg-estate-600 shadow-md shadow-estate-700/20"
          >
            {form.sellRent === "sell" ? "Get My Free Valuation" : "List My Property"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>

          <TrustBadges />
        </form>
      )}

      {step < 4 && (
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex-1"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          )}
          <Button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canAdvance}
            className={cn("flex-1 bg-estate-700 text-white hover:bg-estate-600", step === 1 && "flex-1")}
          >
            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ServicesToggle() {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  const handleComplete = useCallback((name: string) => {
    setSubmittedName(name);
    setSubmitted(true);
  }, []);

  const handleBack = useCallback(() => {
    setIntent(null);
    setSubmitted(false);
  }, []);

  const isBuyRent = intent === "buy" || intent === "rent";
  const intentLabel =
    intent === "buy" ? "Looking to Buy" : intent === "rent" ? "Looking to Rent" : intent === "sell" ? "Looking to Sell" : "Looking to Let";

  return (
    <section id="services" className="bg-subtle px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        {submitted ? (
          <SuccessState intent={intent!} name={submittedName} />
        ) : !intent ? (
          <IntentSelector onSelect={setIntent} />
        ) : (
          <>
            <div className="mb-8 text-center">
              <p className="mb-1 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
                What we offer
              </p>
              <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
                {intentLabel}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isBuyRent
                  ? "Tell us what you're looking for and we'll find the perfect match."
                  : "Share your property details and we'll provide a free market valuation."}
              </p>
            </div>

            {isBuyRent ? (
              <BuyRentForm
                key={intent}
                intent={intent as "buy" | "rent"}
                onComplete={handleComplete}
                onBack={handleBack}
              />
            ) : (
              <SellRentForm
                key={intent}
                intent={intent as "sell" | "list"}
                onComplete={handleComplete}
                onBack={handleBack}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
