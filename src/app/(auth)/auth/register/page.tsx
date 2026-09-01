import type { Metadata } from "next";
import { isGoogleAuthEnabled } from "@/lib/auth/provider-config";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create an account | Haus of Estate",
  robots: { index: false, follow: false },
};

type RegisterPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
    redirectTo?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(first(params.returnTo) ?? first(params.redirectTo), "/");
  const googleEnabled = isGoogleAuthEnabled();

  return <RegisterForm returnTo={returnTo} googleEnabled={googleEnabled} />;
}
