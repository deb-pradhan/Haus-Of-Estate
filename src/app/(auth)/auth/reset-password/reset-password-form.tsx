"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { AuthCard, AuthFeedback, AuthHeading, authHref } from "@/components/auth/auth-form-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiPayload = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[]> };

export function ResetPasswordForm({
  tokenAvailable,
  invalidToken,
  returnTo,
}: {
  tokenAvailable: boolean;
  invalidToken: boolean;
  returnTo: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json().catch(() => ({}))) as ApiPayload;

      if (!response.ok) {
        setError(
          payload.fieldErrors?.password?.[0] ??
            payload.error ??
            "This reset link is invalid or has expired.",
        );
        return;
      }

      setComplete(true);
    } catch {
      setError("We could not reset the password right now. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  if (!tokenAvailable) {
    return (
      <AuthCard>
        <AuthHeading title="Reset link required" description="This page needs a valid password reset link." />
        <AuthFeedback kind="error">
          {invalidToken
            ? "The reset link is invalid or incomplete. Request a new one to continue."
            : "The reset link is missing or incomplete. Request a new one to continue."}
        </AuthFeedback>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href={authHref("/auth/forgot-password", returnTo)}>Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  if (complete) {
    return (
      <AuthCard>
        <AuthHeading title="Password updated" description="Your password has been reset. Sign in again to continue." />
        <AuthFeedback kind="success">Any existing sessions may need to sign in again.</AuthFeedback>
        <Button asChild className="mt-6 w-full" size="lg">
          <Link href={authHref("/auth/login", returnTo)}>Sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeading title="Choose a new password" description="Use a password you do not use on another service." />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthFeedback kind="error">{error}</AuthFeedback>}

        <div>
          <Label htmlFor="new-password">New password</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="new-password" name="password" type="password" placeholder="Enter a new password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" autoComplete="new-password" aria-describedby="reset-password-hint" minLength={8} maxLength={128} disabled={pending} required />
          </div>
          <p id="reset-password-hint" className="mt-1 text-xs text-muted-foreground">Use 8–128 characters.</p>
        </div>

        <div>
          <Label htmlFor="confirm-new-password">Confirm new password</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="confirm-new-password" name="confirmPassword" type="password" placeholder="Enter the password again" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="pl-9" autoComplete="new-password" minLength={8} maxLength={128} disabled={pending} required />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Updating password…</> : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
