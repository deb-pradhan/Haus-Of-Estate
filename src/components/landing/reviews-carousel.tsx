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
            What our clients say
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Experiences shared by clients across our markets in the UK, UAE and
            beyond.
          </p>
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
