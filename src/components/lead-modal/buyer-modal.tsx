"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Home,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BuyerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BEDROOM_OPTIONS = ["1", "2", "3", "4", "5+"];

const AREAS = {
  dubai: [
    { id: "marina", label: "Dubai Marina" },
    { id: "downtown", label: "Downtown Dubai" },
    { id: "palm", label: "Palm Jumeirah" },
    { id: "jbr", label: "JBR" },
    { id: "business_bay", label: "Business Bay" },
    { id: "other", label: "Other / Not sure" },
  ],
  uk: [
    { id: "london", label: "London" },
    { id: "manchester", label: "Manchester" },
    { id: "birmingham", label: "Birmingham" },
    { id: "liverpool", label: "Liverpool" },
    { id: "edinburgh", label: "Edinburgh" },
    { id: "other", label: "Other / Not sure" },
  ],
  bali: [
    { id: "canggu", label: "Canggu" },
    { id: "seminyak", label: "Seminyak" },
    { id: "ubud", label: "Ubud" },
    { id: "uluwatu", label: "Uluwatu" },
    { id: "sanur", label: "Sanur" },
    { id: "other", label: "Other / Not sure" },
  ],
};

type Market = keyof typeof AREAS;

export function BuyerModal({ open, onOpenChange }: BuyerModalProps) {
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState<"buy" | "rent" | null>(null);
  const [useType, setUseType] = useState<"personal" | "investment" | null>(null);
  const [bedrooms, setBedrooms] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [market, setMarket] = useState<Market>("dubai");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setStep(1);
    setIntent(null);
    setUseType(null);
    setBedrooms(null);
    setArea(null);
    setMarket("dubai");
    setFirstName("");
    setEmail("");
    setMobile("");
    setConsent(false);
    setIsSubmitting(false);
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const validateLead = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Valid email required";
    if (!mobile.trim() || mobile.replace(/\D/g, "").length < 7)
      errs.mobile = "Valid phone required";
    if (!consent) errs.consent = "Consent required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateLead();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "buyer",
          buyOrRent: intent,
          useType,
          bedrooms,
          area,
          market,
          firstName,
          email,
          mobile,
          consentGiven: consent,
        }),
      });
    } catch (_) {}
    setIsSubmitting(false);
    setStep(6);
  };

  const totalSteps = 5;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-0 sm:max-w-md">
        {/* Progress */}
        {step <= 5 && (
          <div className="h-1 bg-muted" style={{ borderRadius: "0 0 0 0" }}>
            <div
              className="h-full bg-estate-700 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        )}

        <div className="p-6">
          {step < 5 && (
            <DialogHeader className="text-left mb-5">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Step {step} of {totalSteps}
              </p>
              <DialogTitle className="font-serif text-xl font-medium text-estate-700">
                {step === 1 && "Are you looking to buy or rent?"}
                {step === 2 && "Is it for personal use or investment?"}
                {step === 3 && "How many bedrooms?"}
                {step === 4 && "Which area interests you?"}
              </DialogTitle>
            </DialogHeader>
          )}

          {/* Step 1: Buy or Rent */}
          {step === 1 && (
            <div className="space-y-3">
              {[
                { id: "buy", label: "Buy a property", icon: <Home className="h-5 w-5" /> },
                { id: "rent", label: "Rent a property", icon: <TrendingUp className="h-5 w-5" /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setIntent(opt.id as "buy" | "rent"); setStep(2); }}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
                    intent === opt.id
                      ? "border-estate-700 bg-estate-700/5"
                      : "border-border bg-white hover:border-estate-700/30 hover:shadow-sm",
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    intent === opt.id ? "bg-estate-700 text-white" : "bg-muted text-muted-foreground",
                  )}>
                    {opt.icon}
                  </div>
                  <span className="font-medium text-foreground">{opt.label}</span>
                  {intent === opt.id && <Check className="ml-auto h-5 w-5 text-estate-700" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Personal or Investment */}
          {step === 2 && (
            <div className="space-y-3">
              <button
                onClick={() => { setUseType("personal"); setStep(3); }}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
                  useType === "personal"
                    ? "border-estate-700 bg-estate-700/5"
                    : "border-border bg-white hover:border-estate-700/30 hover:shadow-sm",
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  useType === "personal" ? "bg-estate-700 text-white" : "bg-muted text-muted-foreground",
                )}>
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Personal use</p>
                  <p className="text-xs text-muted-foreground">For my family or myself</p>
                </div>
                {useType === "personal" && <Check className="ml-auto h-5 w-5 text-estate-700" />}
              </button>
              <button
                onClick={() => { setUseType("investment"); setStep(3); }}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
                  useType === "investment"
                    ? "border-estate-700 bg-estate-700/5"
                    : "border-border bg-white hover:border-estate-700/30 hover:shadow-sm",
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  useType === "investment" ? "bg-estate-700 text-white" : "bg-muted text-muted-foreground",
                )}>
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Investment</p>
                  <p className="text-xs text-muted-foreground">For rental yield or capital growth</p>
                </div>
                {useType === "investment" && <Check className="ml-auto h-5 w-5 text-estate-700" />}
              </button>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            </div>
          )}

          {/* Step 3: Bedrooms */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {BEDROOM_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setBedrooms(opt); setStep(4); }}
                    className={cn(
                      "rounded-full border-2 px-5 py-2.5 text-sm font-medium transition-all duration-200",
                      bedrooms === opt
                        ? "border-estate-700 bg-estate-700 text-white"
                        : "border-border bg-white text-foreground hover:border-estate-700/40",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            </div>
          )}

          {/* Step 4: Market + Area */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Preferred market</Label>
                <div className="flex gap-2">
                  {(["dubai", "uk", "bali"] as Market[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMarket(m); setArea(null); }}
                      className={cn(
                        "flex-1 rounded-lg border-2 py-2 text-xs font-medium capitalize transition-all duration-200",
                        market === m
                          ? "border-estate-700 bg-estate-700/5 text-estate-700"
                          : "border-border bg-white text-muted-foreground hover:border-estate-700/30",
                      )}
                    >
                      {m === "dubai" ? "🇦🇪 Dubai" : m === "uk" ? "🇬🇧 UK" : "🇮🇩 Bali"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Area</Label>
                <select
                  value={area ?? ""}
                  onChange={(e) => { setArea(e.target.value); setStep(5); }}
                  className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select an area</option>
                  {AREAS[market].map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            </div>
          )}

          {/* Step 5: Lead capture */}
          {step === 5 && (
            <div className="space-y-4">
              <DialogHeader className="text-left mb-3">
                <DialogTitle className="font-serif text-xl font-medium text-estate-700">
                  Almost there, {firstName || "friend"}.
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Enter your details and an agent will be in touch within 2 hours.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bm-first" className="text-xs font-medium text-foreground">First Name <span className="text-destructive">*</span></Label>
                  <Input id="bm-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="h-11" autoComplete="given-name" />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bm-email" className="text-xs font-medium text-foreground">Email <span className="text-destructive">*</span></Label>
                  <Input id="bm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11" autoComplete="email" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bm-mobile" className="text-xs font-medium text-foreground">Mobile Number <span className="text-destructive">*</span></Label>
                  <Input id="bm-mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} placeholder="+971 XX XXX XXXX" className="h-11" inputMode="tel" autoComplete="tel" />
                  {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border accent-estate-700" />
                    <span className="text-xs leading-relaxed text-muted-foreground">I consent to Haus of Estate contacting me via WhatsApp, SMS, email, and phone about properties and investment opportunities. <span className="text-destructive">*</span></span>
                  </label>
                  {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-estate-700 text-white hover:bg-estate-600 disabled:opacity-50">
                  {isSubmitting ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</div> : <><ArrowRight className="mr-1.5 h-4 w-4" /> Submit</>}
                </Button>
              </form>
              <button onClick={() => setStep(4)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-estate-700/10">
                <Check className="h-7 w-7 text-estate-700" />
              </div>
              <DialogTitle className="font-serif text-2xl font-medium text-estate-700">
                You're all set{firstName ? `, ${firstName}` : ""}. 🎉
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                One of our agents will be in touch within 2 hours with properties matching your criteria.
              </DialogDescription>
              <Button onClick={() => handleOpenChange(false)} className="mt-6 h-11 bg-estate-700 text-white hover:bg-estate-600">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useBuyerModal() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
