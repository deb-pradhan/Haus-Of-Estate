"use client";

import { useState, useRef } from "react";
import {
  ArrowRight,
  Upload,
  Check,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, isValidMobile } from "@/components/ui/phone-input";

const PROPERTY_TYPES = [
  "Flat", "Villa", "Townhouse", "Penthouse", "House", "Cottage", "Land", "Commercial",
];
const VIEW_TYPES = ["City", "Sea", "Garden", "Pool", "Park", "None"];
const URGENCY_OPTIONS = [
  { id: "distress", label: "Distress sale", desc: "Need to sell or rent urgently" },
  { id: "urgent", label: "Urgent", desc: "Looking to move within 1–3 months" },
  { id: "not_urgent", label: "Not urgent", desc: "Taking my time to get the right buyer" },
];

export default function ListPropertyPage() {
  const [step, setStep] = useState(1);
  const [sellOrRent, setSellOrRent] = useState<"sell" | "rent" | null>(null);
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [viewType, setViewType] = useState("");
  const [urgency, setUrgency] = useState<string | null>(null);
  const [titleDeed, setTitleDeed] = useState<File | null>(null);
  const [passport, setPassport] = useState<File | null>(null);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const passportRef = useRef<HTMLInputElement>(null);

  const validateLead = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Required";
    if (!surname.trim()) errs.surname = "Required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Valid email required";
    if (!isValidMobile(mobile)) errs.mobile = "Valid mobile required";
    if (!consent) errs.consent = "Consent required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateLead();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "seller",
          sellOrRent,
          propertyType,
          bedrooms,
          location,
          size,
          viewType,
          urgency,
          firstName,
          surname,
          email,
          mobile,
          consentGiven: consent,
        }),
      });
    } catch (_) {}
    setIsSubmitting(false);
    setStep(6);
  };

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header strip */}
      <div className="bg-estate-700 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-2xl">
          <p className="mb-1 font-serif text-sm font-medium uppercase tracking-widest text-gold-400 opacity-80">
            List with us
          </p>
          <h1 className="font-serif text-3xl font-medium text-white md:text-4xl">
            {sellOrRent === "sell"
              ? "Sell your property with Haus of Estate"
              : sellOrRent === "rent"
                ? "Rent your property with Haus of Estate"
                : "List your property with Haus of Estate"}
          </h1>
          <p className="mt-2 text-base text-white/60">
            Fill in the details below and our team will be in touch within 2 hours.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mx-auto max-w-2xl px-4 pt-8 md:px-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-estate-700" : "bg-border"
                }`}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Step {step} of 5</p>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        {/* Step 1: Sell or Rent */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="mb-4 font-serif text-lg font-medium text-estate-700">
                Are you looking to sell or rent your property?
              </p>
              <div className="space-y-3">
                {[
                  { id: "sell" as const, label: "Sell my property", icon: "🏠" },
                  { id: "rent" as const, label: "Rent my property", icon: "🔑" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setSellOrRent(opt.id); setStep(2); }}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      sellOrRent === opt.id
                        ? "border-estate-700 bg-estate-700/5"
                        : "border-border bg-white hover:border-estate-700/30"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-medium text-foreground">{opt.label}</span>
                    {sellOrRent === opt.id && (
                      <Check className="ml-auto h-5 w-5 text-estate-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Property details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="font-serif text-lg font-medium text-estate-700">Tell us about your property</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Property type</Label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select type</option>
                    {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Bedrooms</Label>
                    <Input
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      placeholder="e.g. 3"
                      inputMode="numeric"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Size (sqft)</Label>
                    <Input
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 1,450"
                      inputMode="numeric"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Location / Area</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Area or community name"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">View type</Label>
                  <div className="flex flex-wrap gap-2">
                    {VIEW_TYPES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setViewType(v)}
                        className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                          viewType === v
                            ? "border-estate-700 bg-estate-700/5 text-estate-700"
                            : "border-border bg-white text-muted-foreground"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setStep(3)}
                disabled={!propertyType || !location}
                className="mt-6 w-full bg-estate-700 text-white hover:bg-estate-600"
              >
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Urgency */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="font-serif text-lg font-medium text-estate-700">Is this urgent?</p>
              </div>
              <div className="space-y-3">
                {URGENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setUrgency(opt.id); setStep(4); }}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      urgency === opt.id
                        ? "border-estate-700 bg-estate-700/5"
                        : "border-border bg-white hover:border-estate-700/30"
                    }`}
                  >
                    <AlertCircle className={`h-5 w-5 shrink-0 ${urgency === opt.id ? "text-estate-700" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    {urgency === opt.id && <Check className="ml-auto h-5 w-5 text-estate-700" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(3)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="font-serif text-lg font-medium text-estate-700">Upload documents (optional)</p>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Upload your title deed and passport copy to help us verify your property quickly. This speeds up the process significantly.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Title Deed</Label>
                  <input ref={titleRef} type="file" accept="image/*,.pdf" onChange={(e) => setTitleDeed(e.target.files?.[0] ?? null)} className="hidden" />
                  <button
                    onClick={() => titleRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 text-left hover:border-estate-700/40"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{titleDeed ? titleDeed.name : "Click to upload"}</p>
                      <p className="text-xs text-muted-foreground">PDF or image</p>
                    </div>
                    {titleDeed && <Check className="ml-auto h-4 w-4 text-trust-teal" />}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Passport Copy</Label>
                  <input ref={passportRef} type="file" accept="image/*,.pdf" onChange={(e) => setPassport(e.target.files?.[0] ?? null)} className="hidden" />
                  <button
                    onClick={() => passportRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 text-left hover:border-estate-700/40"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{passport ? passport.name : "Click to upload"}</p>
                      <p className="text-xs text-muted-foreground">PDF or image</p>
                    </div>
                    {passport && <Check className="ml-auto h-4 w-4 text-trust-teal" />}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Your documents are encrypted and only accessible to authorised Haus of Estate agents.
              </p>
              <Button onClick={() => setStep(5)} className="mt-6 w-full bg-estate-700 text-white hover:bg-estate-600">
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Contact + submit */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(4)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="font-serif text-lg font-medium text-estate-700">Your contact details</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">First Name <span className="text-destructive">*</span></Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="h-11" autoComplete="given-name" />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Surname <span className="text-destructive">*</span></Label>
                    <Input value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Surname" className="h-11" autoComplete="family-name" />
                    {errors.surname && <p className="text-xs text-destructive">{errors.surname}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" className="h-11" autoComplete="email" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Mobile number <span className="text-destructive">*</span></Label>
                  <PhoneInput value={mobile} onChange={setMobile} invalid={!!errors.mobile} />
                  {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-estate-700"
                    />
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      I consent to Haus of Estate contacting me about my property enquiry by WhatsApp, SMS, email or phone. <span className="text-destructive">*</span>
                    </span>
                  </label>
                  {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-estate-700 text-white hover:bg-estate-600 disabled:opacity-50">
                  {isSubmitting ? (
                    <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</div>
                  ) : (
                    <><ArrowRight className="mr-1.5 h-4 w-4" /> Submit enquiry</>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Step 6: Success */}
        {step === 6 && (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-estate-700/10">
              <Check className="h-7 w-7 text-estate-700" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-estate-700">
              You're all set{firstName ? `, ${firstName}` : ""}. 🎉
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our team will review your property details and be in touch within 2 hours with a personalised offer.
            </p>
            <Button
              onClick={() => window.location.href = "/"}
              className="mt-6 bg-estate-700 text-white hover:bg-estate-600"
            >
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
