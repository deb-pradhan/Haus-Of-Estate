import "server-only";

export function isGoogleAuthEnabled(): boolean {
  return (
    process.env.AUTH_GOOGLE_ENABLED === "true" &&
    Boolean(process.env.AUTH_GOOGLE_ID?.trim()) &&
    Boolean(process.env.AUTH_GOOGLE_SECRET?.trim())
  );
}
