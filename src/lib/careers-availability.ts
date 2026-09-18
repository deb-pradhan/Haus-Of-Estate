// Sonia requested a public takedown on 18 September 2026. Reopening requires
// her approval and a reviewed replacement role list; CMS edits must not reopen it.
export const CAREERS_PUBLIC_ENABLED = false;

export const CAREERS_CLOSED_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};

export function isCareersPath(pathname: string): boolean {
  let path = pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // Malformed paths still go through normal Next.js routing.
  }
  return /^\/careers(?:\/|$)/i.test(path);
}

export function careersUnavailableResponse(): Response {
  return new Response(
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="robots" content="noindex"><title>Page unavailable — Haus of Estate</title>' +
      '</head><body><main><h1>This page is currently unavailable.</h1>' +
      '<p><a href="/">Return to Haus of Estate</a></p></main></body></html>',
    {
      status: 404,
      headers: { ...CAREERS_CLOSED_HEADERS, "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
