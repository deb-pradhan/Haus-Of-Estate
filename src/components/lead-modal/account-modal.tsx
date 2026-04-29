"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, isValidMobile } from "@/components/ui/phone-input";
import { Check, ArrowRight, Loader2 } from "lucide-react";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountModal({ open, onOpenChange }: AccountModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setStep("form");
    setIsSubmitting(false);
    setFirstName("");
    setSurname("");
    setEmail("");
    setMobile("");
    setConsent(false);
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Required";
    if (!surname.trim()) errs.surname = "Required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Valid email required";
    if (!isValidMobile(mobile))
      errs.mobile = "Valid mobile number required";
    if (!consent) errs.consent = "Consent required to proceed";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
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
          intent: "account",
          firstName,
          surname,
          email,
          mobile,
          consentGiven: consent,
        }),
      });
    } catch (_) {}
    setIsSubmitting(false);
    setStep("success");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-0 sm:max-w-md">
        {step === "form" ? (
          <div className="p-6">
            <DialogHeader className="text-left">
              <DialogTitle className="font-serif text-2xl font-medium text-estate-700">
                Get in touch
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Tell us where you&apos;re looking and we&apos;ll match you with a vetted specialist for your market.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="am-first" className="text-xs font-medium text-foreground">
                    First name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="am-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                    className="h-11"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="am-surname" className="text-xs font-medium text-foreground">
                    Surname <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="am-surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="Surname"
                    autoComplete="family-name"
                    className="h-11"
                  />
                  {errors.surname && (
                    <p className="text-xs text-destructive">{errors.surname}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="am-email" className="text-xs font-medium text-foreground">
                  Email address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="am-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="am-mobile" className="text-xs font-medium text-foreground">
                  Mobile number <span className="text-destructive">*</span>
                </Label>
                <PhoneInput
                  id="am-mobile"
                  value={mobile}
                  onChange={setMobile}
                  invalid={!!errors.mobile}
                />
                {errors.mobile && (
                  <p className="text-xs text-destructive">{errors.mobile}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-estate-700"
                  />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    I consent to Haus of Estate contacting me about my enquiry by WhatsApp, SMS, email or phone.{" "}
                    <span className="text-destructive">*</span>
                  </span>
                </label>
                {errors.consent && (
                  <p className="text-xs text-destructive">{errors.consent}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full bg-estate-700 text-white hover:bg-estate-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <>
                    Submit enquiry
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              No spam. Our team will be in touch within 2 hours.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-estate-700/10">
              <Check className="h-7 w-7 text-estate-700" />
            </div>
            <DialogTitle className="font-serif text-2xl font-medium text-estate-700">
              Thanks, {firstName}.
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              A specialist will be in touch within 2 hours to discuss your enquiry.
            </DialogDescription>
            <Button
              onClick={() => handleOpenChange(false)}
              className="mt-6 h-11 bg-estate-700 text-white hover:bg-estate-600"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAccountModal() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
