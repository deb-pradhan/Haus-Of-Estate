const UNAVAILABLE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};

export function isAuthPath(pathname: string): boolean {
  let path = pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // Malformed paths still go through normal Next.js routing.
  }
  return /^\/(?:auth|account|messages|viewings|saved)(?:\/|$)/i.test(path);
}

export function authUnavailableResponse(): Response {
  return Response.json(
    { ok: false, error: "This feature is currently unavailable." },
    { status: 404, headers: UNAVAILABLE_HEADERS },
  );
}

export function authPageUnavailableResponse(): Response {
  return new Response(
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="robots" content="noindex"><title>Page unavailable — Haus of Estate</title>' +
      '</head><body><main><h1>This page is currently unavailable.</h1>' +
      '<p><a href="/">Return to Haus of Estate</a></p></main></body></html>',
    {
      status: 404,
      headers: { ...UNAVAILABLE_HEADERS, "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
