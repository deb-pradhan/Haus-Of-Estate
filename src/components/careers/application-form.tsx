"use client";

import { useRef, useState } from "react";
import { ArrowRight, BadgeCheck, Loader2, AlertCircle, Upload } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  CV_ACCEPT,
  CV_MAX_BYTES,
  EXPERIENCE_AREA_OPTIONS,
  HR_INBOX,
  OPPORTUNITY_TYPE_OPTIONS,
  YEARS_OF_EXPERIENCE_OPTIONS,
} from "@/lib/careers";

interface ApplicationFormProps {
  /** "role" — applying to a specific Sanity role. "general" — speculative upload. */
  variant?: "role" | "general";
  roleSlug?: string;
  roleTitle?: string;
  applyEmail?: string;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: string;
  experienceAreas: string[];
  opportunityType: string;
  linkedinUrl: string;
  portfolioUrl: string;
  coverNote: string;
  consent: boolean;
  website: string; // honeypot
}

const INITIAL: FormState = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  yearsOfExperience: "",
  experienceAreas: [],
  opportunityType: "",
  linkedinUrl: "",
  portfolioUrl: "",
  coverNote: "",
  consent: false,
  website: "",
};

export function ApplicationForm({
  variant = "role",
  roleSlug,
  roleTitle,
  applyEmail = HR_INBOX,
}: ApplicationFormProps) {
  const isGeneral = variant === "general";
  const effectiveSlug = isGeneral ? "general-speculative" : roleSlug ?? "";
  const effectiveTitle = isGeneral
    ? "Speculative — Upload your experience"
    : roleTitle ?? "";

  const [form, setForm] = useState<FormState>(INITIAL);
  const [cvName, setCvName] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArea = (area: string) =>
    setForm((f) => ({
      ...f,
      experienceAreas: f.experienceAreas.includes(area)
        ? f.experienceAreas.filter((a) => a !== area)
        : [...f.experienceAreas, area],
    }));

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Please enter your full name.";
    if (!form.email.trim()) next.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Please enter a valid email address.";
    if (!form.phone.trim()) next.phone = "Please enter your mobile number.";
    if (!form.yearsOfExperience)
      next.yearsOfExperience = "Please select your years of experience.";
    if (isGeneral && form.experienceAreas.length === 0)
      next.experienceAreas = "Select at least one area of experience.";
    if (isGeneral && !form.opportunityType)
      next.opportunityType = "Please choose the type of opportunity.";
    const file = cvRef.current?.files?.[0];
    if (!file) next.cv = "Please attach your CV (PDF, DOC or DOCX).";
    else if (file.size > CV_MAX_BYTES) next.cv = "Your CV must be 5MB or smaller.";
    if (form.linkedinUrl && !/^https?:\/\/[^\s]+$/i.test(form.linkedinUrl))
      next.linkedinUrl = "LinkedIn URL should start with https://";
    if (form.portfolioUrl && !/^https?:\/\/[^\s]+$/i.test(form.portfolioUrl))
      next.portfolioUrl = "Portfolio URL should start with https://";
    if (form.coverNote.trim().length > 4000)
      next.coverNote = "Please keep your note to 4,000 characters or fewer.";
    if (!form.consent)
      next.consent = "You need to consent to our processing of your application.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setStatus("submitting");
    try {
      const fd = new FormData();
      fd.set("roleSlug", effectiveSlug);
      fd.set("roleTitle", effectiveTitle);
      fd.set("fullName", form.fullName);
      fd.set("email", form.email);
      fd.set("phone", form.phone);
      fd.set("location", form.location);
      fd.set("yearsOfExperience", form.yearsOfExperience);
      fd.set("linkedinUrl", form.linkedinUrl);
      fd.set("portfolioUrl", form.portfolioUrl);
      fd.set("coverNote", form.coverNote);
      fd.set("consent", String(form.consent));
      fd.set("website", form.website);
      if (isGeneral) {
        fd.set("opportunityType", form.opportunityType);
        form.experienceAreas.forEach((a) => fd.append("experienceAreas", a));
      }
      const file = cvRef.current?.files?.[0];
      if (file) fd.set("cv", file);

      const res = await fetch("/api/applications", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.errors) setErrors(data.errors);
        setServerError(
          data.error ||
            "Something went wrong. Please try again or email us directly.",
        );
        setStatus("error");
        return;
      }
      setStatus("success");
      setForm(INITIAL);
      setCvName("");
      if (cvRef.current) cvRef.current.value = "";
    } catch {
      setServerError(
        "We couldn't reach the server. Please try again or email us directly.",
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-estate-700/10">
          <BadgeCheck className="h-6 w-6 text-estate-700" aria-hidden />
        </div>
        <h3 className="mt-4 font-serif text-xl font-medium text-estate-700">
          Application received.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isGeneral ? (
            <>
              Thank you. Your details and CV are with our team — one of our
              career advisors will reach out if there&apos;s a good fit.
            </>
          ) : (
            <>
              Thank you. Your application for the{" "}
              <strong>{effectiveTitle}</strong> role is in front of our team.
              We&apos;ll reply within two working days, either way.
            </>
          )}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          A confirmation has been sent to your email.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot */}
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </label>
      </div>

      <Field label="Full name" required error={errors.fullName} htmlFor="af-name">
        <input
          id="af-name"
          type="text"
          autoComplete="name"
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          className={inputCls(!!errors.fullName)}
        />
      </Field>

      <Field label="Email" required error={errors.email} htmlFor="af-email">
        <input
          id="af-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className={inputCls(!!errors.email)}
        />
      </Field>

      <Field
        label="Mobile / WhatsApp"
        required
        error={errors.phone}
        htmlFor="af-phone"
      >
        <PhoneInput
          id="af-phone"
          value={form.phone}
          onChange={(v) => set("phone", v)}
          defaultCountry="GB"
          invalid={!!errors.phone}
          className="h-11 rounded-md border-2 border-border bg-surface"
        />
      </Field>

      <Field
        label="Location"
        error={errors.location}
        htmlFor="af-location"
        hint="City and country — e.g. London, UK."
      >
        <input
          id="af-location"
          type="text"
          autoComplete="address-level2"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          className={inputCls(!!errors.location)}
        />
      </Field>

      <Field
        label="Years of experience"
        required
        error={errors.yearsOfExperience}
        htmlFor="af-years"
      >
        <select
          id="af-years"
          value={form.yearsOfExperience}
          onChange={(e) => set("yearsOfExperience", e.target.value)}
          className={inputCls(!!errors.yearsOfExperience)}
        >
          <option value="">Select…</option>
          {YEARS_OF_EXPERIENCE_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Field>

      {isGeneral && (
        <fieldset className="space-y-1.5">
          <legend className="text-xs font-medium text-foreground">
            Areas of experience <span className="text-destructive">*</span>
          </legend>
          <p className="text-xs text-muted-foreground">Select all that apply.</p>
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            {EXPERIENCE_AREA_OPTIONS.map((area) => {
              const checked = form.experienceAreas.includes(area);
              return (
                <label
                  key={area}
                  className={[
                    "flex cursor-pointer items-center gap-2 rounded-md border-2 px-3 py-2 text-sm transition-colors",
                    checked
                      ? "border-estate-700/40 bg-estate-700/[0.06] text-estate-700"
                      : "border-border bg-surface text-foreground hover:border-estate-700/25",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArea(area)}
                    className="h-4 w-4 rounded border-border accent-estate-700"
                  />
                  {area}
                </label>
              );
            })}
          </div>
          {errors.experienceAreas && (
            <p className="text-xs text-destructive">{errors.experienceAreas}</p>
          )}
        </fieldset>
      )}

      {isGeneral && (
        <Field
          label="Type of opportunity"
          required
          error={errors.opportunityType}
          htmlFor="af-opportunity"
        >
          <select
            id="af-opportunity"
            value={form.opportunityType}
            onChange={(e) => set("opportunityType", e.target.value)}
            className={inputCls(!!errors.opportunityType)}
          >
            <option value="">Select…</option>
            {OPPORTUNITY_TYPE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* CV upload */}
      <Field
        label="Upload your CV"
        required
        error={errors.cv}
        htmlFor="af-cv"
        hint="PDF, DOC or DOCX — max 5MB."
      >
        <label
          htmlFor="af-cv"
          className={[
            "flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed px-3 py-3 text-sm transition-colors",
            errors.cv
              ? "border-destructive"
              : cvName
                ? "border-estate-700/40 bg-estate-700/[0.05]"
                : "border-border hover:border-estate-700/30",
          ].join(" ")}
        >
          <Upload
            className={cvName ? "h-4 w-4 text-estate-700" : "h-4 w-4 text-muted-foreground"}
            aria-hidden
          />
          <span className={cvName ? "text-estate-700" : "text-muted-foreground"}>
            {cvName || "Choose a file…"}
          </span>
        </label>
        <input
          id="af-cv"
          ref={cvRef}
          type="file"
          accept={CV_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            setCvName(e.target.files?.[0]?.name ?? "");
            setErrors((prev) => {
              const { cv, ...rest } = prev;
              void cv;
              return rest;
            });
          }}
        />
      </Field>

      <Field
        label="LinkedIn URL"
        error={errors.linkedinUrl}
        htmlFor="af-linkedin"
        hint="Optional."
      >
        <input
          id="af-linkedin"
          type="url"
          inputMode="url"
          placeholder="https://linkedin.com/in/…"
          value={form.linkedinUrl}
          onChange={(e) => set("linkedinUrl", e.target.value)}
          className={inputCls(!!errors.linkedinUrl)}
        />
      </Field>

      <Field
        label="Portfolio / showreel URL"
        error={errors.portfolioUrl}
        htmlFor="af-portfolio"
        hint="Optional — a link to work you're proud of."
      >
        <input
          id="af-portfolio"
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={form.portfolioUrl}
          onChange={(e) => set("portfolioUrl", e.target.value)}
          className={inputCls(!!errors.portfolioUrl)}
        />
      </Field>

      <Field
        label={isGeneral ? "Anything else?" : "Why this role?"}
        error={errors.coverNote}
        htmlFor="af-cover"
        hint="Optional — a few honest sentences are better than a long paragraph."
      >
        <textarea
          id="af-cover"
          rows={4}
          value={form.coverNote}
          onChange={(e) => set("coverNote", e.target.value)}
          className={`${inputCls(!!errors.coverNote)} resize-y`}
          maxLength={4000}
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border accent-estate-700"
        />
        <span>
          I consent to Haus of Estate processing the personal data and CV
          I&apos;ve shared above for the purpose of considering my application.
          I can withdraw consent at any time by emailing{" "}
          <a
            href={`mailto:${applyEmail}`}
            className="text-estate-700 underline-offset-4 hover:underline"
          >
            {applyEmail}
          </a>
          .
        </span>
      </label>
      {errors.consent && (
        <p className="mt-1 text-xs text-destructive">{errors.consent}</p>
      )}

      {serverError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{serverError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-estate-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
          </>
        ) : (
          <>
            {isGeneral ? "Submit your details" : "Submit application"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Prefer email?{" "}
        <a
          href={`mailto:${applyEmail}?subject=${encodeURIComponent(
            isGeneral
              ? "Speculative application — Haus of Estate"
              : `Application — ${effectiveTitle}`,
          )}`}
          className="text-estate-700 underline-offset-4 hover:underline"
        >
          Email us directly
        </a>
        .
      </p>
    </form>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function inputCls(invalid: boolean) {
  return [
    "w-full rounded-md border-2 bg-surface px-3 py-2.5 text-sm",
    "transition-colors placeholder:text-muted-foreground/50",
    "focus:outline-none focus:ring-2 focus:ring-estate-700/20",
    invalid
      ? "border-destructive focus:border-destructive"
      : "border-border focus:border-estate-700/40",
  ].join(" ");
}
