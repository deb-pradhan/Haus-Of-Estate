import { sanityFetch } from "@/sanity";
import { FEATURED_TESTIMONIALS_QUERY } from "@/sanity/queries";
import {
  ReviewsCarousel,
  type ReviewCard,
} from "@/components/landing/reviews-carousel";

const FALLBACK_REVIEWS = [
  {
    name: "Sarah M.",
    market: "Dubai",
    rating: 5,
    text: "Exceptional service from start to finish. The team at Haus of Estate guided us through the entire process and we completed on our dream flat in Marina Gate within 6 weeks.",
    initials: "SM",
    tag: "#TransparentProcess",
    date: "June 2024",
  },
  {
    name: "James T.",
    market: "UK",
    rating: 5,
    text: "As an overseas buyer, I was initially nervous about investing in Manchester. Their transparency on yields and market data gave me complete confidence. Highly recommend.",
    initials: "JT",
    tag: "#GlobalExpertise",
    date: "August 2024",
  },
  {
    name: "Priya & Arjun L.",
    market: "Bali",
    rating: 5,
    text: "We listed our Ubud villa with Haus of Estate and had a qualified buyer within 3 weeks. The team handled everything professionally and the transaction was seamless.",
    initials: "PL",
    tag: "#FastClosing",
    date: "September 2024",
  },
  {
    name: "Ahmed K.",
    market: "Dubai",
    rating: 5,
    text: "I've worked with several agencies in Dubai and Haus of Estate is by far the most transparent and professional. They found us a property that matched our brief perfectly.",
    initials: "AK",
    tag: "#TransparentProcess",
    date: "October 2024",
  },
  {
    name: "Maria S.",
    market: "UK",
    rating: 5,
    text: "Moving from Singapore to London as a non-resident was daunting. Haus of Estate made everything simple — from mortgage advice to property management post-purchase.",
    initials: "MS",
    tag: "#GlobalExpertise",
    date: "November 2024",
  },
  {
    name: "David R.",
    market: "Bali",
    rating: 5,
    text: "The Bali team sourced properties that weren't even on the market yet. Their local network is incredible. Closed on a villa in Canggu within 2 months of first enquiry.",
    initials: "DR",
    tag: "#FastClosing",
    date: "December 2024",
  },
];

interface SanityTestimonial {
  _id: string;
  authorName: string;
  authorLocation?: string;
  rating?: number;
  quote: string;
  tag?: string;
  datePublished?: string;
}

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function formatPublishedDate(iso?: string): string {
  if (!iso) return "Recently";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";

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

  const reviews: ReviewCard[] =
    data && data.length > 0
      ? data.map((testimonial) => ({
          key: testimonial._id,
          name: testimonial.authorName,
          market: testimonial.authorLocation || "",
          rating:
            typeof testimonial.rating === "number" ? testimonial.rating : 5,
          text: testimonial.quote,
          initials: initialsFrom(testimonial.authorName),
          tag: testimonial.tag || "#Verified",
          date: formatPublishedDate(testimonial.datePublished),
        }))
      : FALLBACK_REVIEWS.map((review) => ({
          ...review,
          key: review.name + review.date,
        }));

  return <ReviewsCarousel reviews={reviews} />;
}
