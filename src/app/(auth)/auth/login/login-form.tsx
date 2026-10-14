"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
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

type LoginFormProps = {
  returnTo: string;
  googleEnabled: boolean;
};

export function LoginForm({ returnTo, googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"credentials" | "google" | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending("credentials");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: returnTo,
      });

      if (result?.error) {
        setError("We could not sign you in with those details. Please try again.");
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("We could not sign you in right now. Please try again shortly.");
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

  const disabled = pending !== null;

  return (
    <AuthCard>
      <AuthHeading
        title="Welcome back"
        description="Sign in to continue securely to Haus of Estate."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthFeedback kind="error">{error}</AuthFeedback>}

        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" autoComplete="email" inputMode="email" disabled={disabled} required />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password">Password</Label>
            <Link href={authHref("/auth/forgot-password", returnTo)} className="text-xs text-estate-700 underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" name="password" type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" autoComplete="current-password" disabled={disabled} required />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={disabled}>
          {pending === "credentials" ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
          ) : (
            <>Sign in<ArrowRight className="h-4 w-4" /></>
          )}
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
        Don&apos;t have an account?{" "}
        <Link href={authHref("/auth/register", returnTo)} className="font-medium text-estate-700 underline-offset-4 hover:underline">
          Create account
        </Link>
      </p>
    </AuthCard>
  );
}
