"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { AuthCard, AuthFeedback, AuthHeading, authHref } from "@/components/auth/auth-form-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({ returnTo }: { returnTo: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
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

      setSent(true);
    } catch {
      setError("We could not process the request right now. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard>
      <AuthHeading
        title="Reset your password"
        description="Enter your email and we will send a reset link if an account can use one."
      />

      {sent ? (
        <AuthFeedback kind="success">
          If an eligible account exists for that address, a password reset link is on its way.
        </AuthFeedback>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthFeedback kind="error">{error}</AuthFeedback>}
          <div>
            <Label htmlFor="recovery-email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="recovery-email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" autoComplete="email" inputMode="email" maxLength={254} disabled={pending} required />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending link…</> : "Send reset link"}
          </Button>
        </form>
      )}

      <Button asChild variant="ghost" className="mt-5 w-full">
        <Link href={authHref("/auth/login", returnTo)}>
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </Button>
    </AuthCard>
  );
}
