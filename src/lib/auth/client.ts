"use client";

import { SessionProvider, useSession } from "next-auth/react";

export { SessionProvider };

export const useAuthSession = useSession;

export function useRequireAuth() {
  const { data: session, status } = useSession();
  return { session, status, isLoading: status === "loading", isAuthenticated: !!session };
}

export function useUserRole() {
  const { data: session } = useSession();
  return (session?.user as { role?: string })?.role ?? "BUYER";
}