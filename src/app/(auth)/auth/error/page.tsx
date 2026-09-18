import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AuthCard, AuthFeedback, AuthHeading, authHref } from "@/components/auth/auth-form-shared";
import { Button } from "@/components/ui/button";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { callbackCookieReturnTo } from "@/lib/auth/callback-return-to";

export const metadata: Metadata = {
  title: "Sign-in issue | Haus of Estate",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    error?: string | string[];
    returnTo?: string | string[];
    redirectTo?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeErrorMessage(code: string | undefined) {
  switch (code) {
    case "AccessDenied":
      return "This sign-in attempt was not approved. Please try again or use another sign-in method.";
    case "OAuthAccountNotLinked":
      return "Use the same sign-in method you originally chose for this account.";
    case "Verification":
      return "The verification link is invalid or has expired. Request a new link to continue.";
    case "SessionRequired":
      return "Please sign in before continuing to that page.";
    case "Configuration":
      return "Sign-in is temporarily unavailable. Please try again later.";
    default:
      return "We could not complete sign-in. No account details were changed.";
  }
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const callbackCookie =
    cookieStore.get("__Secure-authjs.callback-url")?.value ??
    cookieStore.get("authjs.callback-url")?.value;
  const explicitReturnTo = first(params.returnTo) ?? first(params.redirectTo);
  const returnTo = explicitReturnTo
    ? safeReturnTo(explicitReturnTo, "/")
    : callbackCookieReturnTo(
        callbackCookie,
        process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL,
      );
  const message = safeErrorMessage(first(params.error));

  return (
    <AuthCard>
      <AuthHeading title="We could not sign you in" description="There was a problem completing the secure sign-in flow." />
      <AuthFeedback kind="error">{message}</AuthFeedback>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button asChild>
          <Link href={authHref("/auth/login", returnTo)}>Try again</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
