import type { Metadata } from "next";
import { isGoogleAuthEnabled } from "@/lib/auth/provider-config";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | Haus of Estate",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
    redirectTo?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(
    first(params.returnTo) ?? first(params.redirectTo),
    "/",
  );
  const googleEnabled = isGoogleAuthEnabled();

  return <LoginForm returnTo={returnTo} googleEnabled={googleEnabled} />;
}
