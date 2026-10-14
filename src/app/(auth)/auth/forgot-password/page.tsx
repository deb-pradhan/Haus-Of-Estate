import type { Metadata } from "next";
import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { getBotProtectionClientConfig } from "@/lib/bot-protection/config";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password | Haus of Estate",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ returnTo?: string | string[]; redirectTo?: string | string[] }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(first(params.returnTo) ?? first(params.redirectTo), "/");
  return (
    <ForgotPasswordForm
      returnTo={returnTo}
      botProtection={getBotProtectionClientConfig()}
    />
  );
}
