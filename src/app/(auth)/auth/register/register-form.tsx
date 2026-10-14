"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2, Lock, Mail, User } from "lucide-react";
import {
  AuthCard,
  AuthFeedback,
  AuthHeading,
  AuthProviderDivider,
  GoogleMark,
  authHref,
} from "@/components/auth/auth-form-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileChallenge } from "@/components/auth/turnstile-challenge";
import type { BotProtectionClientConfig } from "@/lib/bot-protection/types";

type RegisterFormProps = {
  returnTo: string;
  googleEnabled: boolean;
  botProtection: BotProtectionClientConfig;
};
type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;
type ApiPayload = {
  ok?: boolean;
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

export function RegisterForm({
  returnTo,
  googleEnabled,
  botProtection,
}: RegisterFormProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [pending, setPending] = useState<"credentials" | "google" | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [challengeRevision, setChallengeRevision] = useState(0);

  function resetChallenge() {
    setTurnstileToken(null);
    setChallengeRevision((current) => current + 1);
  }

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ password: "The passwords do not match." });
      return;
    }

    setPending("credentials");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          returnTo,
          ...(botProtection.enabled ? { turnstileToken } : {}),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as ApiPayload;

      if (!response.ok) {
        const nextFieldErrors: FieldErrors = {};
        for (const field of ["name", "email", "password"] as const) {
          const message = payload.fieldErrors?.[field]?.[0];
          if (message) nextFieldErrors[field] = message;
        }
        setFieldErrors(nextFieldErrors);
        setError(
          response.status === 429
            ? "Too many attempts. Please wait before trying again."
            : payload.code?.startsWith("BOT_CHALLENGE_")
              ? payload.error ?? "Complete the security check and try again."
              : "We could not create the account. Check the details and try again.",
        );
        resetChallenge();
        return;
      }

      setSubmitted(true);
    } catch {
      setError("We could not create the account right now. Please try again shortly.");
      resetChallenge();
    } finally {
      setPending(null);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setPending("google");
    try {
      await signIn("google", { redirectTo: returnTo });
    } catch {
      setError("Google sign-in is unavailable right now. Please try again shortly.");
      setPending(null);
    }
  }

  if (submitted) {
    return (
      <AuthCard>
        <AuthHeading title="Check your email" description="If the address can be registered, we have sent a verification link. Open it before signing in." />
        <AuthFeedback kind="success">For your security, verification links expire. You can request a new one if needed.</AuthFeedback>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href={authHref("/auth/login", returnTo)}>Continue to sign in</Link>
        </Button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <Link href={authHref("/auth/verify", returnTo)} className="font-medium text-estate-700 underline-offset-4 hover:underline">Request another link</Link>
        </p>
      </AuthCard>
    );
  }

  const disabled = pending !== null;
  const challengeComplete =
    !botProtection.enabled ||
    (botProtection.siteKey !== null && turnstileToken !== null);
  const passwordDescription = ["password-hint", fieldErrors.password && "password-error"].filter(Boolean).join(" ");

  return (
    <AuthCard>
      <AuthHeading title="Create your account" description="Keep your Haus account secure and return to your property journey." />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthFeedback kind="error">{error}</AuthFeedback>}

        <div>
          <Label htmlFor="name">Full name</Label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" name="name" placeholder="Your full name" value={form.name} onChange={update("name")} className="pl-9" autoComplete="name" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined} minLength={2} maxLength={100} disabled={disabled} required />
          </div>
          {fieldErrors.name && <p id="name-error" className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} className="pl-9" autoComplete="email" inputMode="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} maxLength={254} disabled={disabled} required />
          </div>
          {fieldErrors.email && <p id="email-error" className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" name="password" type="password" placeholder="Create a password" value={form.password} onChange={update("password")} className="pl-9" autoComplete="new-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={passwordDescription} minLength={8} maxLength={128} disabled={disabled} required />
          </div>
          <p id="password-hint" className="mt-1 text-xs text-muted-foreground">Use 8–128 characters.</p>
          {fieldErrors.password && <p id="password-error" className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Enter the password again" value={form.confirmPassword} onChange={update("confirmPassword")} className="pl-9" autoComplete="new-password" minLength={8} maxLength={128} disabled={disabled} required />
          </div>
        </div>

        <TurnstileChallenge
          key={challengeRevision}
          config={botProtection}
          action="register"
          onTokenChange={setTurnstileToken}
        />

        <Button type="submit" className="w-full" size="lg" disabled={disabled || !challengeComplete}>
          {pending === "credentials" ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : <>Create account<ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <AuthProviderDivider />
          <Button type="button" variant="outline" className="w-full" size="lg" disabled={disabled} onClick={() => void handleGoogleSignIn()}>
            {pending === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
            Continue with Google
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={authHref("/auth/login", returnTo)} className="font-medium text-estate-700 underline-offset-4 hover:underline">Sign in</Link>
      </p>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        By creating an account, you agree to our <Link href="/legal/terms-of-service" className="underline">Terms of Service</Link> and <Link href="/legal/privacy-policy" className="underline">Privacy Policy</Link>. Account creation does not subscribe you to marketing.
      </p>
    </AuthCard>
  );
}
