"use client";

import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput, isValidMobile } from "@/components/ui/phone-input";
import {
  LEAD_FORM_VERSION,
  PRIVACY_NOTICE_VERSION,
  MARKETING_CONSENT_WORDING,
  PRIVACY_ACKNOWLEDGEMENT_WORDING,
  PROPERTY_MATCH_CONSENT_WORDING,
  leadIntakeV2Schema,
  type LeadIntakeV2Input,
} from "@/lib/lead-intake/contract";
import { trackLeadEvent } from "./analytics";
import { getLeadAttribution, primeLeadAttribution } from "./attribution";

const TOPICS = [
  { value: "general_enquiry", label: "A general question or service enquiry" },
  { value: "buy", label: "Buying a property" },
  { value: "rent", label: "Renting a property" },
  { value: "invest", label: "Investing in property" },
  { value: "sell_let", label: "Selling or letting my property" },
] as const;
type Topic = (typeof TOPICS)[number]["value"];
const INITIAL_VALUES = {
  interest: "general_enquiry" as Topic,
  message: "",
  firstName: "",
  email: "",
  phone: "",
  market: "",
  location: "",
  privacyAcknowledged: false,
  newsletterOptIn: false,
  propertyMatchOptIn: false,
  website: "",
};
type FieldErrors = Record<string, string | undefined>;

export function EnquiryForm() {
  const id = useId();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<
    "idle" | "submitting" | "error" | "success"
  >("idle");
  const submissionId = useRef<string | null>(null);
  const sending = useRef(false);
  const viewed = useRef(false);
  const started = useRef(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const supportsMatches = ["buy", "rent", "invest"].includes(values.interest);
  const isPropertyQuestion = values.interest !== "general_enquiry";

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    primeLeadAttribution();
    trackLeadEvent("form_view", {
      form_version: LEAD_FORM_VERSION,
      surface: "query_page",
      has_project: false,
    });
  }, []);

  useEffect(() => {
    if (state === "success" || state === "error") responseRef.current?.focus();
  }, [state]);

  function update<Key extends keyof typeof values>(
    key: Key,
    value: (typeof values)[Key],
  ) {
    if (!started.current) {
      started.current = true;
      trackLeadEvent("form_start", {
        form_version: LEAD_FORM_VERSION,
        surface: "query_page",
        step: 1,
        interest: key === "interest" ? (value as Topic) : values.interest,
        has_project: false,
      });
    }
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "interest" &&
      !["buy", "rent", "invest"].includes(String(value))
        ? { propertyMatchOptIn: false }
        : {}),
      ...(key === "interest" && value === "general_enquiry"
        ? { market: "", location: "" }
        : {}),
    }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      request: undefined,
    }));
    if (state === "error") setState("idle");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    submissionId.current ??= crypto.randomUUID();
    const payload: LeadIntakeV2Input = {
      submissionId: submissionId.current,
      interest: values.interest,
      contact: {
        firstName: values.firstName.trim(),
        email: values.email.trim(),
        phone: values.phone || undefined,
        message: values.message.trim(),
      },
      preferences: isPropertyQuestion
        ? {
            market: values.market.trim() || undefined,
            location: values.location.trim() || undefined,
          }
        : undefined,
      privacyAcknowledged: values.privacyAcknowledged,
      newsletterOptIn: values.newsletterOptIn,
      propertyMatchOptIn: supportsMatches && values.propertyMatchOptIn,
      overseasCashBuyer: false,
      formVersion: LEAD_FORM_VERSION,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      context: getLeadAttribution("query_page"),
      website: values.website,
    };
    const parsed = leadIntakeV2Schema.safeParse(payload);
    const nextErrors: FieldErrors = {};
    if (!values.message.trim())
      nextErrors.message = "Tell us what you would like to know.";
    if (!values.firstName.trim())
      nextErrors.firstName = "Enter your first name.";
    if (values.phone && !isValidMobile(values.phone))
      nextErrors.phone = "Enter a valid phone number or leave this blank.";
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path.at(-1));
        nextErrors[field] ??=
          field === "email" ? "Enter a valid email address." : issue.message;
      }
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const firstField = [
        "interest",
        "message",
        "market",
        "location",
        "firstName",
        "email",
        "phone",
        "privacyAcknowledged",
      ].find((field) => nextErrors[field]);
      if (firstField) document.getElementById(`${id}-${firstField}`)?.focus();
      return;
    }
    sending.current = true;
    setState("submitting");
    setErrors({});
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        status?: string;
      } | null;
      if (
        !response.ok ||
        result?.success !== true ||
        !["created", "duplicate"].includes(result.status ?? "")
      ) {
        throw new Error(
          response.status === 429
            ? "Please wait a few minutes before trying again. Your question is still here."
            : response.status === 409
              ? "An enquiry has already been saved with this reference. Refresh the page if you want to send a different question."
              : "We couldn’t confirm your question was saved. Please try again, or email info@hausofestate.com.",
        );
      }
      setState("success");
      trackLeadEvent("lead_submit_success", {
        form_version: LEAD_FORM_VERSION,
        surface: "query_page",
        interest: values.interest,
        has_project: false,
      });
      if (values.newsletterOptIn)
        trackLeadEvent("newsletter_opt_in", {
          form_version: LEAD_FORM_VERSION,
          surface: "query_page",
          interest: values.interest,
          has_project: false,
        });
    } catch (error) {
      setErrors({
        request:
          error instanceof Error
            ? error.message
            : "We couldn’t send your question. Please try again.",
      });
      setState("error");
    } finally {
      sending.current = false;
    }
  }

  function fieldError(field: string) {
    return errors[field] ? (
      <p
        id={`${id}-${field}-error`}
        role="alert"
        className="text-sm text-destructive"
      >
        {errors[field]}
      </p>
    ) : null;
  }
  function describedBy(field: string) {
    return errors[field] ? `${id}-${field}-error` : undefined;
  }

  if (state === "success")
    return (
      <div
        ref={responseRef}
        tabIndex={-1}
        role="status"
        className="flex min-h-96 flex-col items-center justify-center py-10 text-center outline-none"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-estate-700/10 text-estate-700">
          <Check aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-serif text-3xl text-estate-700">
          Your question has been received.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
          Thank you for getting in touch. We’ve saved your enquiry for the Haus
          of Estate team to respond using the details you provided.
        </p>
        {values.newsletterOptIn || values.propertyMatchOptIn ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Your email-update choices have also been recorded.
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/properties">Explore properties</Link>
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setValues(INITIAL_VALUES);
              setErrors({});
              setState("idle");
              submissionId.current = null;
              started.current = false;
              requestAnimationFrame(() =>
                document.getElementById(`${id}-message`)?.focus(),
              );
            }}
          >
            Ask another question
          </Button>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate aria-busy={state === "submitting"}>
      <fieldset
        disabled={state === "submitting"}
        className="min-w-0 space-y-6 border-0 p-0"
      >
        <legend className="sr-only">Your question and contact details</legend>
        <div className="space-y-2">
          <Label htmlFor={`${id}-interest`}>What’s it about?</Label>
          <select
            id={`${id}-interest`}
            value={values.interest}
            onChange={(event) =>
              update("interest", event.target.value as Topic)
            }
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-message`}>What would you like to know?</Label>
          <Textarea
            id={`${id}-message`}
            value={values.message}
            onChange={(event) => update("message", event.target.value)}
            maxLength={2000}
            required
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy("message")}
            placeholder="For example: I’m thinking about buying my first property in Dubai. Where should I start?"
            className="min-h-36 resize-y text-base"
          />
          {fieldError("message")}
          <p className="text-xs leading-5 text-muted-foreground">
            A few details are enough. We can follow up if we need to know more.
          </p>
        </div>
        {isPropertyQuestion ? (
          <div className="grid gap-4 rounded-lg border border-border bg-subtle p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${id}-market`}>
                Country of interest (optional)
              </Label>
              <Input
                id={`${id}-market`}
                value={values.market}
                maxLength={80}
                onChange={(event) => update("market", event.target.value)}
                placeholder="e.g. United Arab Emirates"
                aria-invalid={Boolean(errors.market)}
                aria-describedby={describedBy("market")}
              />
              {fieldError("market")}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-location`}>City or area (optional)</Label>
              <Input
                id={`${id}-location`}
                value={values.location}
                maxLength={160}
                onChange={(event) => update("location", event.target.value)}
                placeholder="e.g. Dubai Marina"
                aria-invalid={Boolean(errors.location)}
                aria-describedby={describedBy("location")}
              />
              {fieldError("location")}
            </div>
          </div>
        ) : null}
        <div className="border-t border-border pt-6">
          <h2 className="font-serif text-2xl text-estate-700">
            How can we reach you?
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${id}-firstName`}>First name</Label>
              <Input
                id={`${id}-firstName`}
                value={values.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                autoComplete="given-name"
                maxLength={80}
                required
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={describedBy("firstName")}
              />
              {fieldError("firstName")}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-email`}>Email address</Label>
              <Input
                id={`${id}-email`}
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy("email")}
              />
              {fieldError("email")}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`${id}-phone`}>Phone number (optional)</Label>
              <PhoneInput
                id={`${id}-phone`}
                value={values.phone}
                onChange={(value) => update("phone", value)}
                invalid={Boolean(errors.phone)}
                ariaDescribedBy={describedBy("phone")}
              />
              {fieldError("phone")}
            </div>
          </div>
        </div>
        <div className="space-y-3 border-t border-border pt-5">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input
              id={`${id}-privacyAcknowledged`}
              type="checkbox"
              checked={values.privacyAcknowledged}
              onChange={(event) =>
                update("privacyAcknowledged", event.target.checked)
              }
              required
              aria-invalid={Boolean(errors.privacyAcknowledged)}
              aria-describedby={describedBy("privacyAcknowledged")}
              className="mt-1 h-4 w-4 shrink-0 accent-estate-700"
            />
            <span>{PRIVACY_ACKNOWLEDGEMENT_WORDING}</span>
          </label>
          {fieldError("privacyAcknowledged")}
          <Link
            href="/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-estate-700 underline underline-offset-4"
          >
            Read our Privacy Policy
          </Link>
        </div>
        <div className="space-y-3 rounded-lg bg-subtle p-4">
          <p className="text-sm font-semibold">Keep in touch (optional)</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Our email updates are still being prepared. You can save your
            preferences now.
          </p>
          {supportsMatches ? (
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                checked={values.propertyMatchOptIn}
                onChange={(event) =>
                  update("propertyMatchOptIn", event.target.checked)
                }
                className="mt-1 h-4 w-4 shrink-0 accent-estate-700"
              />
              <span>{PROPERTY_MATCH_CONSENT_WORDING}</span>
            </label>
          ) : null}
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={values.newsletterOptIn}
              onChange={(event) =>
                update("newsletterOptIn", event.target.checked)
              }
              className="mt-1 h-4 w-4 shrink-0 accent-estate-700"
            />
            <span>{MARKETING_CONSENT_WORDING}</span>
          </label>
          <p className="text-xs leading-5 text-muted-foreground">
            You can send your question without signing up for email updates.
          </p>
        </div>
        <div className="sr-only" aria-hidden="true">
          <label htmlFor={`${id}-website`}>Website</label>
          <input
            id={`${id}-website`}
            name="website"
            value={values.website}
            onChange={(event) => update("website", event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        {errors.request ? (
          <div
            ref={responseRef}
            role="alert"
            tabIndex={-1}
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive outline-none"
          >
            <p>{errors.request}</p>
            <a
              className="mt-2 inline-block underline"
              href="mailto:info@hausofestate.com"
            >
              Email the team
            </a>
          </div>
        ) : null}
        <Button
          type="submit"
          disabled={state === "submitting"}
          className="h-12 w-full text-base"
        >
          {state === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{" "}
              Sending your question
            </>
          ) : (
            <>
              Send my question{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </fieldset>
    </form>
  );
}
