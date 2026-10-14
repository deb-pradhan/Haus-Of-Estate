import type { NextRequest } from "next/server";
import { authUnavailableResponse } from "@/lib/auth/availability";
import { isAuthEnabled } from "@/lib/features";

export async function GET(request: NextRequest) {
  if (!isAuthEnabled()) return authUnavailableResponse();
  const { handlers } = await import("@/auth");
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  if (!isAuthEnabled()) return authUnavailableResponse();
  const { handlers } = await import("@/auth");
  return handlers.POST(request);
}
