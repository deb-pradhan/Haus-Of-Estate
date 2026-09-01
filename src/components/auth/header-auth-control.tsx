"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { CircleUserRound, Loader2, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthSession } from "@/lib/auth/client";

function loginHref(pathname: string, searchParams: URLSearchParams) {
  const search = searchParams.toString();
  const returnTo = `${pathname}${search ? `?${search}` : ""}`;
  return `/auth/login?${new URLSearchParams({ returnTo }).toString()}`;
}

export function HeaderAuthControl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);

  if (status === "loading") {
    return (
      <span
        aria-label="Checking sign-in status"
        className="inline-flex h-10 w-10 animate-pulse rounded-lg bg-muted sm:w-20"
      />
    );
  }

  if (!session?.user) {
    return (
      <Button asChild variant="ghost" className="h-10 px-2 text-estate-700 sm:px-3">
        <Link href={loginHref(pathname, new URLSearchParams(searchParams))}>
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign in</span>
          <span className="sr-only sm:hidden">Sign in</span>
        </Link>
      </Button>
    );
  }

  const displayName = session.user.name?.trim() || session.user.email || "Account";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut({ redirectTo: "/" });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 max-w-40 gap-2 px-2 text-estate-700 sm:px-3"
          aria-label="Open account menu"
        >
          <CircleUserRound className="h-5 w-5 shrink-0" />
          <span className="hidden truncate text-sm md:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="min-w-0">
          <span className="block truncate">{session.user.name || "Your account"}</span>
          {session.user.email && (
            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
              {session.user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={() => void handleSignOut()}
          className="min-h-10 cursor-pointer"
        >
          {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
