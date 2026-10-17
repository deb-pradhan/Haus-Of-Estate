"use client";

import { useEffect, useState } from "react";
import { Pause, Play, Star } from "lucide-react";

export interface ReviewCard {
  key: string;
  name: string;
  market: string;
  /** Per-review stars from the CMS; null hides the stars. */
  rating: number | null;
  text: string;
  initials: string;
  tag: string | null;
  /** Named third-party source (e.g. "Google Reviews"), shown only when supplied. */
  source: string | null;
  /** Formatted publication date, or null. */
  date: string | null;
}

/** Below this many reviews a scrolling marquee looks sparse, so show a static grid. */
const MARQUEE_MIN = 4;

function ReviewArticle({ review, hidden }: { review: ReviewCard; hidden?: boolean }) {
  const footer = [review.source ? `Source: ${review.source}` : null, review.date]
    .filter(Boolean)
    .join(" · ");
  return (
    <article
      className="flex w-80 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm"
      aria-label={`${review.name} review`}
      aria-hidden={hidden || undefined}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-estate-700/10 font-serif text-sm font-semibold text-estate-700">
            {review.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{review.name}</p>
            {review.market && <p className="text-xs text-muted-foreground">{review.market}</p>}
          </div>
        </div>
        {review.rating !== null && (
          <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
            {Array.from({ length: review.rating }).map((_, star) => (
              <Star key={star} className="h-3.5 w-3.5 fill-gold-500 text-gold-500" aria-hidden />
            ))}
          </div>
        )}
      </div>

      {review.tag && (
        <div className="mb-3">
          <span className="rounded-full bg-estate-700/8 px-2.5 py-0.5 text-xs font-medium text-estate-700">
            {review.tag}
          </span>
        </div>
      )}

      <p className="text-sm leading-relaxed text-foreground">&ldquo;{review.text}&rdquo;</p>

      {footer && (
        <div className="mt-4 flex items-center border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">{footer}</span>
        </div>
      )}
    </article>
  );
}

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

  const useMarquee = reviews.length >= MARQUEE_MIN;

  return (
    <section id="reviews" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-2">Client stories</p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            What our clients say
          </h2>
        </div>

        {useMarquee ? (
          <>
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => setPaused((current) => !current)}
                aria-pressed={paused}
                aria-label={paused ? "Play reviews carousel" : "Pause reviews carousel"}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-estate-700"
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
                  <div key={`${review.key}-${index}`} className="mx-3 flex">
                    <ReviewArticle review={review} hidden={index >= reviews.length} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div
            className="flex flex-wrap justify-center gap-6"
            role="list"
            aria-label="Client reviews"
          >
            {reviews.map((review) => (
              <div key={review.key} role="listitem" className="flex">
                <ReviewArticle review={review} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
