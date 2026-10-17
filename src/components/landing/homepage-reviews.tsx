import { sanityFetch } from "@/sanity";
import { FEATURED_TESTIMONIALS_QUERY } from "@/sanity/queries";
import {
  ReviewsCarousel,
  type ReviewCard,
} from "@/components/landing/reviews-carousel";

interface SanityTestimonial {
  _id: string;
  authorName: string;
  authorLocation?: string;
  rating?: number;
  quote: string;
  tag?: string;
  source?: string;
  datePublished?: string;
}

/**
 * Only third-party sources are labelled. "verified" and "other" are editor
 * defaults, not evidence, so they never produce a "Verified" stamp.
 */
const SOURCE_LABELS: Record<string, string> = {
  google: "Google Reviews",
  trustpilot: "Trustpilot",
};

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function formatPublishedDate(iso?: string): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function HomepageReviews() {
  const { data } = await sanityFetch<SanityTestimonial[]>({
    query: FEATURED_TESTIMONIALS_QUERY,
    throwOnError: true,
  });

  // No real testimonials in the CMS means no review section. Never fall back
  // to placeholder reviews.
  if (!data || data.length === 0) return null;

  const reviews: ReviewCard[] = data.map((testimonial) => ({
    key: testimonial._id,
    name: testimonial.authorName,
    market: testimonial.authorLocation || "",
    rating:
      typeof testimonial.rating === "number" &&
      testimonial.rating >= 1 &&
      testimonial.rating <= 5
        ? Math.round(testimonial.rating)
        : null,
    text: testimonial.quote,
    initials: initialsFrom(testimonial.authorName),
    tag: testimonial.tag || null,
    source: (testimonial.source && SOURCE_LABELS[testimonial.source]) || null,
    date: formatPublishedDate(testimonial.datePublished),
  }));

  return <ReviewsCarousel reviews={reviews} />;
}
