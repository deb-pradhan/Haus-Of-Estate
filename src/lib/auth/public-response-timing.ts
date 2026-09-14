import { randomInt } from "node:crypto";

export async function settlePublicAuthResponse(startedAt: number) {
  if (process.env.NODE_ENV !== "production") return;

  const targetMs = 900 + randomInt(0, 201);
  const remainingMs = targetMs - (Date.now() - startedAt);
  if (remainingMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingMs));
  }
}
