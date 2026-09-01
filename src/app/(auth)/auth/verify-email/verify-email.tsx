"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { AuthCard, AuthFeedback, AuthHeading, authHref } from "@/components/auth/auth-form-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VerificationState =
  | "confirm"
  | "checking"
  | "verified"
  | "failed"
  | "resend"
  | "resent";

export function VerifyEmail({
  tokenAvailable,
  invalidToken,
  returnTo,
}: {
  tokenAvailable: boolean;
  invalidToken: boolean;
  returnTo: string;
}) {
  const [state, setState] = useState<VerificationState>(
    tokenAvailable ? "confirm" : invalidToken ? "failed" : "resend",
  );
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  async function handleVerify() {
    setState("checking");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      setState(response.ok ? "verified" : "failed");
    } catch {
      setState("failed");
    }
  }

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo }),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? "Too many attempts. Please wait before trying again."
            : "We could not process the request right now. Please try again shortly.",
        );
        return;
      }
      setState("resent");
    } catch {
      setError("We could not process the request right now. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  if (state === "checking") {
    return (
      <AuthCard>
        <AuthHeading title="Verifying your email" description="Please wait while we securely check your verification link." />
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking link…
        </div>
      </AuthCard>
    );
  }

  if (state === "confirm") {
    return (
      <AuthCard>
        <AuthHeading
          title="Verify your email"
          description="Confirm that you want to activate this Haus account."
        />
        <Button
          type="button"
          className="mt-6 w-full"
          size="lg"
          disabled={!hydrated}
          onClick={() => void handleVerify()}
        >
          Verify email
        </Button>
      </AuthCard>
    );
  }

  if (state === "verified") {
    return (
      <AuthCard>
        <AuthHeading title="Email verified" description="Your Haus account is ready to use." />
        <AuthFeedback kind="success">You can now sign in and continue where you left off.</AuthFeedback>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href={authHref("/auth/login", returnTo)}>Continue to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  if (state === "failed") {
    return (
      <AuthCard>
        <AuthHeading title="Link not accepted" description="This verification link is invalid or has expired." />
        <AuthFeedback kind="error">Request a fresh link to verify your email securely.</AuthFeedback>
        <Button type="button" className="mt-6 w-full" size="lg" onClick={() => setState("resend")}>Request a new link</Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeading title={state === "resent" ? "Check your email" : "Verify your email"} description={state === "resent" ? "If an eligible account exists, we have sent a fresh verification link." : "Enter your email to request a new verification link."} />
      {state === "resent" ? (
        <AuthFeedback kind="success">Verification links expire, so use the newest message in your inbox.</AuthFeedback>
      ) : (
        <form onSubmit={handleResend} className="space-y-4">
          {error && <AuthFeedback kind="error">{error}</AuthFeedback>}
          <div>
            <Label htmlFor="verification-email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="verification-email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" autoComplete="email" inputMode="email" maxLength={254} disabled={pending} required />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending link…</> : "Send verification link"}
          </Button>
        </form>
      )}

      <Button asChild variant="ghost" className="mt-5 w-full">
        <Link href={authHref("/auth/login", returnTo)}>Back to sign in</Link>
      </Button>
    </AuthCard>
  );
}
