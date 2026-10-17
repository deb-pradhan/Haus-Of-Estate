"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: replaces the root layout, so global CSS, fonts and
 * Tailwind are NOT available. Inline styles use the brand palette directly
 * (Estate Green #1F4F2F, Ink #1E1F21, canvas #ECE8E0, Gold 700 #76603A).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", { name: error.name, digest: error.digest });
  }, [error]);

  const button = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "0 1.5rem",
    borderRadius: 9999,
    fontSize: "0.9375rem",
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: "pointer",
    textDecoration: "none",
  } as const;

  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          background: "#ECE8E0",
          color: "#1E1F21",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        <main
          role="alert"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "6rem 1rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#76603A",
              fontWeight: 500,
            }}
          >
            Haus of Estate
          </p>
          <h1
            style={{
              margin: "1rem 0 0",
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 500,
              fontSize: "clamp(2rem, 6vw, 3rem)",
              lineHeight: 1.15,
            }}
          >
            We couldn&rsquo;t load this page.
          </h1>
          <p
            style={{
              maxWidth: 440,
              margin: "1rem 0 0",
              fontSize: "1.0625rem",
              lineHeight: 1.55,
              color: "#4D5257",
            }}
          >
            That one is on us. Please try again in a moment, or speak to an
            advisor and we will pick it up with you directly.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                ...button,
                background: "#1F4F2F",
                color: "#fff",
                border: "1px solid #1F4F2F",
              }}
            >
              Try again
            </button>
            <a
              href="https://wa.me/971585607033?utm_source=site&utm_medium=global-error&utm_campaign=whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...button,
                background: "transparent",
                color: "#1F4F2F",
                border: "1px solid rgba(31,79,47,0.4)",
              }}
            >
              Speak to an advisor
            </a>
          </div>
          {error.digest ? (
            <p style={{ marginTop: "2.5rem", fontSize: 14, color: "#4D5257" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
