import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { VerifyEmail } from "../verify-email/verify-email";

export const metadata: Metadata = {
  title: "Verify your email | Haus of Estate",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    token?: string | string[];
    returnTo?: string | string[];
    redirectTo?: string | string[];
    ready?: string | string[];
    invalid?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = first(params.token) ?? "";
  const returnTo = safeReturnTo(first(params.returnTo) ?? first(params.redirectTo), "/");
  if (token) {
    const exchange = new URLSearchParams({
      purpose: "email-verification",
      token,
      returnTo,
    });
    redirect(`/api/auth/action-token/exchange?${exchange.toString()}`);
  }
  return (
    <VerifyEmail
      tokenAvailable={first(params.ready) === "1"}
      invalidToken={first(params.invalid) === "1"}
      returnTo={returnTo}
    />
  );
}
