"use client";

import { useState, useRef } from "react";
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
import { PhoneInput, isValidMobile } from "@/components/ui/phone-input";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROPERTY_TYPES = [
  "Apartment", "Villa", "Townhouse", "Penthouse", "House", "Cottage", "Land", "Commercial",
];
const VIEW_TYPES = ["City", "Sea", "Garden", "Pool", "Park", "None"];
const URGENCY_OPTIONS = [
  { id: "distress", label: "Distress sale", desc: "Need to sell urgently" },
  { id: "urgent", label: "Urgent", desc: "Looking to sell soon" },
  { id: "not_urgent", label: "Not urgent", desc: "Taking my time" },
];

export function SellerModal({ open, onOpenChange }: SellerModalProps) {
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
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const passportRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1); setSellOrRent(null); setPropertyType("");
    setBedrooms(""); setLocation(""); setSize(""); setViewType("");
    setUrgency(null); setTitleDeed(null); setPassport(null);
    setFirstName(""); setEmail(""); setMobile(""); setConsent(false);
    setIsSubmitting(false); setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const validateLead = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Required";
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
    const formData = new FormData();
    if (titleDeed) formData.append("titleDeed", titleDeed);
    if (passport) formData.append("passport", passport);
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
        {step <= 5 && (
          <div className="h-1 bg-muted">
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
                {step === 1 && "Are you looking to sell or rent your property?"}
                {step === 2 && "Tell us about your property"}
                {step === 3 && "Is this urgent?"}
                {step === 4 && "Upload documents"}
              </DialogTitle>
            </DialogHeader>
          )}

          {/* Step 1: Sell or Rent */}
          {step === 1 && (
            <div className="space-y-3">
              {[
                { id: "sell", label: "Sell my property", icon: "🏠" },
                { id: "rent", label: "Rent my property", icon: "🔑" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSellOrRent(opt.id as "sell" | "rent"); setStep(2); }}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
                    sellOrRent === opt.id
                      ? "border-estate-700 bg-estate-700/5"
                      : "border-border bg-white hover:border-estate-700/30 hover:shadow-sm",
                  )}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="font-medium text-foreground">{opt.label}</span>
                  {sellOrRent === opt.id && <Check className="ml-auto h-5 w-5 text-estate-700" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Property details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Property type</Label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select type</option>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Bedrooms</Label>
                  <Input
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="e.g. 3"
                    className="h-11"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Size (sqft)</Label>
                  <Input
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 1,450"
                    className="h-11"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Area or community name"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">View type</Label>
                <div className="flex flex-wrap gap-2">
                  {VIEW_TYPES.map((v) => (
                    <button
                      key={v}
                      onClick={() => setViewType(v)}
                      className={cn(
                        "rounded-full border-2 px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200",
                        viewType === v
                          ? "border-estate-700 bg-estate-700/5 text-estate-700"
                          : "border-border bg-white text-muted-foreground hover:border-estate-700/30",
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setStep(1)} className="h-9">
                  <ArrowLeft className="mr-1 h-3 w-3" /> Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
                  disabled={!propertyType || !location}
                  className="h-9 flex-1 bg-estate-700 text-white hover:bg-estate-600"
                >
                  Next <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Urgency */}
          {step === 3 && (
            <div className="space-y-3">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setUrgency(opt.id); setStep(4); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200",
                    urgency === opt.id
                      ? "border-estate-700 bg-estate-700/5"
                      : "border-border bg-white hover:border-estate-700/30 hover:shadow-sm",
                  )}
                >
                  <AlertCircle className={cn(
                    "h-5 w-5 shrink-0",
                    urgency === opt.id ? "text-estate-700" : "text-muted-foreground",
                  )} />
                  <div>
                    <p className="font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {urgency === opt.id && <Check className="ml-auto h-5 w-5 text-estate-700" />}
                </button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="h-9 mt-2">
                <ArrowLeft className="mr-1 h-3 w-3" /> Back
              </Button>
            </div>
          )}

          {/* Step 4: File upload */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Upload your title deed and passport copy to help us verify your property quickly.
              </p>

              {/* Title deed */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Title Deed</Label>
                <input
                  ref={titleRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setTitleDeed(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  onClick={() => titleRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 text-left transition-colors hover:border-estate-700/40"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {titleDeed ? titleDeed.name : "Click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF or image</p>
                  </div>
                  {titleDeed && <Check className="ml-auto h-4 w-4 text-trust-teal" />}
                </button>
              </div>

              {/* Passport */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Passport Copy</Label>
                <input
                  ref={passportRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPassport(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  onClick={() => passportRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 text-left transition-colors hover:border-estate-700/40"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {passport ? passport.name : "Click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF or image</p>
                  </div>
                  {passport && <Check className="ml-auto h-4 w-4 text-trust-teal" />}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Your documents are encrypted and only accessible to our authorised agents.
              </p>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setStep(3)} className="h-9">
                  <ArrowLeft className="mr-1 h-3 w-3" /> Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(5)}
                  className="h-9 flex-1 bg-estate-700 text-white hover:bg-estate-600"
                >
                  Next <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Lead capture */}
          {step === 5 && (
            <div className="space-y-4">
              <DialogHeader className="text-left mb-3">
                <DialogTitle className="font-serif text-xl font-medium text-estate-700">
                  Almost there{firstName ? `, ${firstName}` : ""}.
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  We'll review your property and be in touch within 2 hours.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sm-first" className="text-xs font-medium text-foreground">First name <span className="text-destructive">*</span></Label>
                  <Input id="sm-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="h-11" autoComplete="given-name" />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sm-email" className="text-xs font-medium text-foreground">Email <span className="text-destructive">*</span></Label>
                  <Input id="sm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11" autoComplete="email" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sm-mobile" className="text-xs font-medium text-foreground">Mobile number <span className="text-destructive">*</span></Label>
                  <PhoneInput id="sm-mobile" value={mobile} onChange={setMobile} invalid={!!errors.mobile} />
                  {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border accent-estate-700" />
                    <span className="text-xs leading-relaxed text-muted-foreground">I consent to Haus of Estate contacting me about my property enquiry. <span className="text-destructive">*</span></span>
                  </label>
                  {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-estate-700 text-white hover:bg-estate-600 disabled:opacity-50">
                  {isSubmitting ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</div> : <><ArrowRight className="mr-1.5 h-4 w-4" /> Submit enquiry</>}
                </Button>
              </form>
              <Button variant="outline" size="sm" onClick={() => setStep(4)} className="h-9">
                <ArrowLeft className="mr-1 h-3 w-3" /> Back
              </Button>
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
                Our team will review your property details and be in touch within 2 hours.
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

export function useSellerModal() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
