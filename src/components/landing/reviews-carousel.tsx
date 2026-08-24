"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Pause, Play, Star } from "lucide-react";

export interface ReviewCard {
  key: string;
  name: string;
  market: string;
  rating: number;
  text: string;
  initials: string;
  tag: string;
  date: string;
}

const MARKET_RATINGS = [
  { market: "Dubai", rating: 4.9, count: 127 },
  { market: "UK", rating: 4.8, count: 84 },
  { market: "Bali", rating: 5.0, count: 31 },
];

export function ReviewsCarousel({ reviews }: { reviews: ReviewCard[] }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPaused(mediaQuery.matches);
    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  return (
    <section id="reviews" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            Client stories
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Rated 4.8 / 5 — Excellent
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Reviewed by clients on Google and across our markets in the UK, UAE
            and beyond.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <a
            href="https://www.google.com/search?q=Haus+of+Estate"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Read Haus of Estate reviews on Google"
            className="group flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden>
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            <span className="text-sm font-semibold text-foreground">Google</span>
            <span aria-hidden className="h-4 w-px bg-border" />
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
              <span className="text-sm font-semibold text-estate-700">4.8</span>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </span>
          </a>
        </div>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs md:text-sm">
          {MARKET_RATINGS.map((market, index) => (
            <span key={market.market} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-muted-foreground">
                <Star className="h-3 w-3 fill-gold-500 text-gold-500" aria-hidden />
                <span className="font-semibold text-estate-700">{market.rating}</span>
                <span aria-hidden>·</span>
                <span>{market.market}</span>
                <span className="text-muted-foreground/70">({market.count})</span>
              </span>
              {index < MARKET_RATINGS.length - 1 && (
                <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />
              )}
            </span>
          ))}
        </div>

        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPaused((current) => !current)}
            aria-pressed={paused}
            aria-label={paused ? "Play reviews carousel" : "Pause reviews carousel"}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-estate-700"
          >
            {paused ? (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden /> Play
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden /> Pause
              </>
            )}
          </button>
        </div>

        <div className="relative overflow-hidden" aria-label="Client reviews">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />

          <div
            className="flex animate-marquee"
            style={{
              width: "max-content",
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {[...reviews, ...reviews].map((review, index) => (
              <article
                key={`${review.key}-${index}`}
                className="mx-3 flex w-80 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm"
                aria-label={`${review.name} review`}
                aria-hidden={index >= reviews.length}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-estate-700/10 font-serif text-sm font-semibold text-estate-700">
                      {review.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.market}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: review.rating }).map((_, star) => (
                      <Star key={star} className="h-3.5 w-3.5 fill-gold-500 text-gold-500" aria-hidden />
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="rounded-full bg-estate-700/8 px-2.5 py-0.5 text-xs font-medium text-estate-700">
                    {review.tag}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{review.text}&rdquo;
                </p>

                <div className="mt-4 flex items-center border-t border-border pt-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-trust-teal" />
                    Verified — {review.date}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
