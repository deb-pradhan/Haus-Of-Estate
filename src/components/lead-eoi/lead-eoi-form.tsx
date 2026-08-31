"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  Building2,
  Check,
  Home,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  TrendingUp,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  LEAD_FORM_VERSION,
  MARKETING_CONSENT_WORDING,
  PRIVACY_NOTICE_VERSION,
  PROPERTY_MATCH_CONSENT_WORDING,
  type LeadIntakeV2Input,
} from "@/lib/lead-intake/contract";
import { SocialProfileLinks } from "@/components/social/social-profile-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput, isValidMobile } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trackLeadEvent } from "./analytics";
import { getLeadAttribution, primeLeadAttribution } from "./attribution";
import type {
  LeadInterest,
  LeadProjectContext,
  LeadSurface,
} from "./types";

const INTEREST_OPTIONS: Array<{
  value: LeadInterest;
  label: string;
  description: string;
  icon: typeof Home;
}> = [
  {
    value: "buy",
    label: "Buy",
    description: "Find a home or second property",
    icon: Home,
  },
  {
    value: "rent",
    label: "Rent",
    description: "Explore homes available to let",
    icon: KeyRound,
  },
  {
    value: "invest",
    label: "Invest",
    description: "Compare opportunities and returns",
    icon: TrendingUp,
  },
  {
    value: "sell_let",
    label: "Sell or let",
    description: "Speak to us about your property",
    icon: Building2,
  },
  {
    value: "newsletter_only",
    label: "Newsletter only",
    description: "Receive market news and insights",
    icon: Mail,
  },
];

const MARKET_OPTIONS = ["UK", "Dubai", "Bali", "Cyprus", "Other / not sure"];
const PROPERTY_TYPE_OPTIONS = [
  "Apartment",
  "House",
  "Villa",
  "Mansion",
  "Townhouse",
  "Land",
  "Commercial",
  "Other / not sure",
];
const BEDROOM_OPTIONS = ["Studio", "1", "2", "3", "4", "5+"];
const BATHROOM_OPTIONS = ["1", "2", "3", "4", "5+"];
const TIMEFRAME_OPTIONS = [
  "Immediately",
  "Within 3 months",
  "3-6 months",
  "6-12 months",
  "More than 12 months",
  "Just researching",
];

type SubmitState = "idle" | "submitting" | "error" | "success";

interface LeadEoiFormProps {
  surface: LeadSurface;
  initialInterest?: LeadInterest;
  initialEmail?: string;
  project?: LeadProjectContext;
  modal?: boolean;
  onClose?: () => void;
}

interface FormValues {
  interest: LeadInterest | "";
  market: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  timeframe: string;
  firstName: string;
  email: string;
  phone: string;
  message: string;
  propertyMatchOptIn: boolean;
  newsletterOptIn: boolean;
  website: string;
}

interface FormErrors {
  interest?: string;
  firstName?: string;
  email?: string;
  phone?: string;
  newsletterOptIn?: string;
  request?: string;
}

function inferMarket(project?: LeadProjectContext) {
  const place = `${project?.city ?? ""} ${project?.country ?? ""}`.toLowerCase();
  if (place.includes("dubai") || place.includes("emirates")) return "Dubai";
  if (place.includes("united kingdom") || place.includes(" uk")) return "UK";
  if (place.includes("bali") || place.includes("indonesia")) return "Bali";
  if (place.includes("cyprus")) return "Cyprus";
  return "";
}

function inferInterest(project?: LeadProjectContext): LeadInterest | undefined {
  if (project?.listingType?.length === 1 && project.listingType[0] === "rent") {
    return "rent";
  }
  return project ? "buy" : undefined;
}

function initialValues(
  project?: LeadProjectContext,
  initialInterest?: LeadInterest,
  initialEmail?: string,
): FormValues {
  return {
    interest: initialInterest ?? inferInterest(project) ?? "",
    market: inferMarket(project),
    location: project?.community ?? "",
    propertyType: project?.unitType ?? "",
    bedrooms:
      typeof project?.bedrooms === "number"
        ? project.bedrooms === 0
          ? "Studio"
          : String(project.bedrooms)
        : "",
    bathrooms:
      typeof project?.bathrooms === "number" ? String(project.bathrooms) : "",
    timeframe: "",
    firstName: "",
    email: initialEmail ?? "",
    phone: "",
    message: "",
    propertyMatchOptIn: false,
    newsletterOptIn: false,
    website: "",
  };
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionsWithCurrentValue(options: string[], value: string): string[] {
  return value && !options.includes(value) ? [value, ...options] : options;
}

function supportsPropertyMatches(interest: LeadInterest | "") {
  return interest === "buy" || interest === "rent" || interest === "invest";
}

function createSubmissionId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function LeadEoiForm({
  surface,
  initialInterest,
  initialEmail,
  project,
  modal = false,
  onClose,
}: LeadEoiFormProps) {
  const id = useId();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FormValues>(() =>
    initialValues(project, initialInterest, initialEmail),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submittedValues, setSubmittedValues] = useState<FormValues | null>(null);
  const submissionId = useRef(createSubmissionId());
  const hasStarted = useRef(false);
  const hasTrackedView = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestErrorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const newsletterOptInRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    primeLeadAttribution();
    trackLeadEvent("form_view", {
      form_version: LEAD_FORM_VERSION,
      surface,
      interest: values.interest || undefined,
      has_project: Boolean(project),
    });
    // A form instance represents one view; later field changes must not re-fire it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (submitState !== "success") return;
    window.requestAnimationFrame(() => successRef.current?.focus());
  }, [submitState]);

  useEffect(() => {
    if (!errors.newsletterOptIn) return;
    window.requestAnimationFrame(() => newsletterOptInRef.current?.focus());
  }, [errors.newsletterOptIn]);

  const markStarted = (interest?: LeadInterest) => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    trackLeadEvent("form_start", {
      form_version: LEAD_FORM_VERSION,
      surface,
      interest: interest ?? (values.interest || undefined),
      step,
      has_project: Boolean(project),
    });
  };

  const update = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    markStarted(key === "interest" && value ? (value as LeadInterest) : undefined);
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "interest" && !supportsPropertyMatches(value as LeadInterest)
        ? { propertyMatchOptIn: false }
        : {}),
    }));
    if (key in errors) {
      setErrors((current) => ({ ...current, [key]: undefined, request: undefined }));
    } else if (errors.request) {
      setErrors((current) => ({ ...current, request: undefined }));
    }
  };

  const moveToStep = (nextStep: number) => {
    setStep(nextStep);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  };

  const validateCurrentStep = () => {
    const nextErrors: FormErrors = {};
    if (step === 1 && !values.interest) {
      nextErrors.interest = "Choose the option that best matches your enquiry.";
    }
    if (step === 3) {
      if (!values.firstName.trim()) {
        nextErrors.firstName = "Enter your first name.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        nextErrors.email = "Enter a valid email address.";
      }
      if (values.phone && !isValidMobile(values.phone)) {
        nextErrors.phone = "Enter a valid phone number or leave this blank.";
      }
      if (values.interest === "newsletter_only" && !values.newsletterOptIn) {
        nextErrors.newsletterOptIn =
          "Choose the newsletter option to complete this subscription.";
      }
    }

    setErrors(nextErrors);
    const firstInvalidId = nextErrors.interest
      ? `${id}-${INTEREST_OPTIONS[0].value}`
      : nextErrors.firstName
        ? `${id}-first-name`
        : nextErrors.email
          ? `${id}-email`
          : nextErrors.phone
            ? `${id}-phone`
            : nextErrors.newsletterOptIn
              ? `${id}-newsletter-opt-in`
            : undefined;
    if (firstInvalidId) {
      window.requestAnimationFrame(() =>
        document.getElementById(firstInvalidId)?.focus(),
      );
    }
    return !firstInvalidId;
  };

  const reset = () => {
    setValues(initialValues(project, initialInterest, initialEmail));
    setErrors({});
    setSubmitState("idle");
    setSubmittedValues(null);
    setStep(1);
    submissionId.current = createSubmissionId();
    hasStarted.current = false;
  };

  const submit = async () => {
    const interest = values.interest;
    if (!interest) return;

    const submitted = { ...values, interest };
    setSubmittedValues(submitted);
    setSubmitState("submitting");
    setErrors({});

    const preferences = {
      market: optional(submitted.market),
      location: optional(submitted.location),
      propertyType: optional(submitted.propertyType),
      bedrooms: optional(submitted.bedrooms),
      bathrooms: optional(submitted.bathrooms),
      timeframe: optional(submitted.timeframe),
    };
    const hasPreferences = Object.values(preferences).some(Boolean);

    const payload: LeadIntakeV2Input = {
      submissionId: submissionId.current,
      interest: submitted.interest,
      preferences: hasPreferences ? preferences : undefined,
      project: project ? { slug: project.slug } : undefined,
      contact: {
        firstName: submitted.firstName.trim(),
        email: submitted.email.trim(),
        phone: optional(submitted.phone),
        message: optional(submitted.message),
      },
      propertyMatchOptIn: submitted.propertyMatchOptIn,
      newsletterOptIn: submitted.newsletterOptIn,
      formVersion: LEAD_FORM_VERSION,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      context: getLeadAttribution(surface),
      website: submitted.website,
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const friendlyMessage =
          response.status === 429
            ? "We have received several requests from this connection. Please wait a few minutes and try again."
            : response.status >= 500
              ? "We could not save your enquiry just now. Please try again."
              : responseBody?.error || "Please check your details and try again.";
        throw new Error(friendlyMessage);
      }

      setSubmitState("success");
      trackLeadEvent("lead_submit_success", {
        form_version: LEAD_FORM_VERSION,
        surface,
        interest: submitted.interest,
        has_project: Boolean(project),
      });
      if (submitted.newsletterOptIn) {
        trackLeadEvent("newsletter_opt_in", {
          form_version: LEAD_FORM_VERSION,
          surface,
          interest: submitted.interest,
          has_project: Boolean(project),
        });
      }
    } catch (error) {
      setSubmitState("error");
      setErrors({
        request:
          error instanceof Error
            ? error.message
            : "We could not save your enquiry. Please try again.",
      });
      window.requestAnimationFrame(() => requestErrorRef.current?.focus());
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;
    if (step < 3) {
      moveToStep(step + 1);
      return;
    }
    void submit();
  };

  const successValues = submittedValues ?? values;

  if (submitState === "success") {
    return (
      <div
        ref={successRef}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        className="flex min-h-[25rem] flex-col items-center justify-center px-2 py-8 text-center outline-none"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-estate-700/10 text-estate-700">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-serif text-3xl font-medium text-estate-700">
          {successValues.interest === "newsletter_only"
            ? "Subscription confirmed"
            : supportsPropertyMatches(successValues.interest)
              ? "Brief received"
              : "Enquiry received"}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          {successValues.interest === "newsletter_only"
            ? "You are subscribed to Haus of Estate property news and insights."
            : successValues.propertyMatchOptIn && successValues.newsletterOptIn
              ? "Our team will respond to your brief. You will also receive matching property opportunities and the Haus of Estate newsletter."
              : successValues.propertyMatchOptIn
                ? "Our team will respond to your brief. You will also receive property opportunities matching it."
                : successValues.newsletterOptIn
                  ? "Our team will respond to your enquiry. You are also subscribed to the Haus of Estate newsletter."
                  : "Our team has your details and will respond about your enquiry as soon as possible."}
        </p>
        <p className="mt-6 text-xs font-semibold uppercase text-muted-foreground">
          Follow along
        </p>
        <SocialProfileLinks className="mt-2 justify-center" />
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {modal && onClose ? (
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          ) : (
            <Button asChild>
              <Link href="/properties">Browse properties</Link>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={reset}>
            Send another enquiry
          </Button>
        </div>
      </div>
    );
  }

  const isNewsletterOnly = values.interest === "newsletter_only";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitState === "submitting"}
      className="min-w-0"
    >
      <fieldset
        disabled={submitState === "submitting"}
        className="min-w-0 border-0 p-0"
      >
      {project ? (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-estate-700/15 bg-estate-700/[0.04] p-3.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-estate-700">
              Selected property
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              {project.title ?? project.slug}
            </p>
            {project.community || project.city ? (
              <p className="truncate text-xs text-muted-foreground">
                {[project.community, project.city].filter(Boolean).join(", ")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Enquiry progress">
        {["Interest", "Preferences", "Contact"].map((label, index) => {
          const number = index + 1;
          const current = step === number;
          const complete = step > number;
          return (
            <li key={label} aria-current={current ? "step" : undefined}>
              <div
                className={cn(
                  "h-1 rounded-full",
                  current || complete ? "bg-estate-700" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "mt-1.5 block text-[11px] font-medium",
                  current ? "text-estate-700" : "text-muted-foreground",
                )}
              >
                {number}. {label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <section aria-labelledby={`${id}-step-title`}>
          <h2
            id={`${id}-step-title`}
            ref={headingRef}
            tabIndex={-1}
            className="font-serif text-2xl font-medium text-estate-700 outline-none sm:text-3xl"
          >
            How can we help?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose one option. You can add more detail on the next step.
          </p>
          <fieldset className="mt-5">
            <legend className="sr-only">Your property interest</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {INTEREST_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    htmlFor={`${id}-${option.value}`}
                    className={cn(
                      "flex min-h-20 cursor-pointer items-start gap-3 rounded-md border bg-surface p-3.5 transition-colors focus-within:ring-2 focus-within:ring-ring/50",
                      values.interest === option.value
                        ? "border-estate-700 bg-estate-700/[0.04]"
                        : "border-border hover:border-estate-700/40",
                      option.value === "newsletter_only" && "sm:col-span-2",
                    )}
                  >
                    <input
                      id={`${id}-${option.value}`}
                      type="radio"
                      name={`${id}-interest`}
                      value={option.value}
                      checked={values.interest === option.value}
                      onChange={() => update("interest", option.value)}
                      className="sr-only"
                    />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-estate-700/10 text-estate-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.interest ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {errors.interest}
              </p>
            ) : null}
          </fieldset>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby={`${id}-step-title`}>
          <h2
            id={`${id}-step-title`}
            ref={headingRef}
            tabIndex={-1}
            className="font-serif text-2xl font-medium text-estate-700 outline-none sm:text-3xl"
          >
            {isNewsletterOnly ? "What interests you?" : "Shape your search"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            All preferences are optional. Share only what is useful today.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SelectField
              id={`${id}-market`}
              label="Market"
              value={values.market}
              options={MARKET_OPTIONS}
              placeholder="Choose a market"
              onChange={(value) => update("market", value)}
            />
            <TextField
              id={`${id}-location`}
              label="Preferred location"
              value={values.location}
              placeholder="City, area or community"
              icon={MapPin}
              onChange={(value) => update("location", value)}
            />
            {!isNewsletterOnly ? (
              <>
                <SelectField
                  id={`${id}-property-type`}
                  label="Property type"
                  value={values.propertyType}
                  options={optionsWithCurrentValue(
                    PROPERTY_TYPE_OPTIONS,
                    values.propertyType,
                  )}
                  placeholder="Choose a type"
                  onChange={(value) => update("propertyType", value)}
                />
                <SelectField
                  id={`${id}-bedrooms`}
                  label="Bedrooms"
                  value={values.bedrooms}
                  options={optionsWithCurrentValue(
                    BEDROOM_OPTIONS,
                    values.bedrooms,
                  )}
                  placeholder="Any"
                  icon={Home}
                  onChange={(value) => update("bedrooms", value)}
                />
                <SelectField
                  id={`${id}-bathrooms`}
                  label="Bathrooms"
                  value={values.bathrooms}
                  options={optionsWithCurrentValue(
                    BATHROOM_OPTIONS,
                    values.bathrooms,
                  )}
                  placeholder="Any"
                  icon={Bath}
                  onChange={(value) => update("bathrooms", value)}
                />
                <SelectField
                  id={`${id}-timeframe`}
                  label="Timeframe"
                  value={values.timeframe}
                  options={TIMEFRAME_OPTIONS}
                  placeholder="Choose a timeframe"
                  onChange={(value) => update("timeframe", value)}
                />
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby={`${id}-step-title`}>
          <h2
            id={`${id}-step-title`}
            ref={headingRef}
            tabIndex={-1}
            className="font-serif text-2xl font-medium text-estate-700 outline-none sm:text-3xl"
          >
            Where should we reach you?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We only need a name and email to respond.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-first-name`}>
                First name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${id}-first-name`}
                value={values.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                autoComplete="given-name"
                required
                aria-required="true"
                maxLength={80}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? `${id}-first-name-error` : undefined}
                className="h-11"
              />
              {errors.firstName ? (
                <p
                  id={`${id}-first-name-error`}
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.firstName}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-email`}>
                Email address <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${id}-email`}
                type="email"
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
                autoComplete="email"
                inputMode="email"
                required
                aria-required="true"
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${id}-email-error` : undefined}
                className="h-11"
              />
              {errors.email ? (
                <p
                  id={`${id}-email-error`}
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.email}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${id}-phone`}>Phone number (optional)</Label>
              <PhoneInput
                id={`${id}-phone`}
                value={values.phone}
                onChange={(value) => update("phone", value)}
                invalid={Boolean(errors.phone)}
                ariaDescribedBy={errors.phone ? `${id}-phone-error` : undefined}
              />
              {errors.phone ? (
                <p
                  id={`${id}-phone-error`}
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.phone}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${id}-message`}>Anything else? (optional)</Label>
              <div className="relative">
                <MessageSquareText
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Textarea
                  id={`${id}-message`}
                  value={values.message}
                  onChange={(event) => update("message", event.target.value)}
                  placeholder="Tell us what would make this enquiry more useful"
                  maxLength={2_000}
                  className="min-h-20 pl-9"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3 rounded-md border border-border bg-subtle p-4">
            {supportsPropertyMatches(values.interest) ? (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  id={`${id}-property-match-opt-in`}
                  type="checkbox"
                  checked={values.propertyMatchOptIn}
                  onChange={(event) =>
                    update("propertyMatchOptIn", event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-estate-700"
                />
                <span className="text-sm leading-5 text-foreground">
                  {PROPERTY_MATCH_CONSENT_WORDING}
                </span>
              </label>
            ) : null}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                id={`${id}-newsletter-opt-in`}
                ref={newsletterOptInRef}
                type="checkbox"
                checked={values.newsletterOptIn}
                onChange={(event) => update("newsletterOptIn", event.target.checked)}
                aria-invalid={Boolean(errors.newsletterOptIn)}
                aria-describedby={
                  errors.newsletterOptIn
                    ? `${id}-newsletter-opt-in-error`
                    : undefined
                }
                className="mt-0.5 h-4 w-4 shrink-0 accent-estate-700"
              />
              <span className="text-sm leading-5 text-foreground">
                {MARKETING_CONSENT_WORDING}
              </span>
            </label>
            {errors.newsletterOptIn ? (
              <p
                id={`${id}-newsletter-opt-in-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.newsletterOptIn}
              </p>
            ) : null}
          </div>

          <div className="sr-only" aria-hidden="true">
            <Label htmlFor={`${id}-website`}>Website</Label>
            <Input
              id={`${id}-website`}
              name="website"
              value={values.website}
              onChange={(event) => update("website", event.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            By submitting, you ask Haus of Estate to use these details to respond to
            your enquiry. This is separate from optional email marketing. Read our{" "}
            <Link
              href="/legal/privacy-policy"
              target="_blank"
              className="font-medium text-estate-700 underline underline-offset-2"
            >
              privacy policy
            </Link>
            .
          </p>

          {errors.request ? (
            <div
              ref={requestErrorRef}
              tabIndex={-1}
              role="alert"
              className="mt-4 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive outline-none"
            >
              {errors.request}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
        {step > 1 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => moveToStep(step - 1)}
            disabled={submitState === "submitting"}
          >
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
        ) : modal && onClose ? (
          <Button type="button" variant="ghost" onClick={onClose}>
            Not now
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={submitState === "submitting"} className="min-w-32">
          {submitState === "submitting" ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" /> Sending
            </>
          ) : step < 3 ? (
            <>
              Continue <ArrowRight aria-hidden="true" />
            </>
          ) : (
            <>
              {isNewsletterOnly
                ? "Subscribe"
                : supportsPropertyMatches(values.interest)
                  ? "Send my brief"
                  : "Send enquiry"}
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
      </fieldset>
    </form>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  icon?: typeof Home;
  onChange: (value: string) => void;
}

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  icon: Icon,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        ) : null}
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-input bg-transparent px-3 pr-9 text-sm shadow-xs outline-none transition-[color,box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/50",
            Icon && "pl-9",
            !value && "text-muted-foreground",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option} className="text-foreground">
              {option}
            </option>
          ))}
        </select>
        <ArrowRight
          className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 rotate-90 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  icon: typeof Home;
  onChange: (value: string) => void;
}

function TextField({
  id,
  label,
  value,
  placeholder,
  icon: Icon,
  onChange,
}: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={160}
          className="h-11 pl-9"
        />
      </div>
    </div>
  );
}
