import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Mail, MessageSquareText } from "lucide-react";
import { EnquiryForm } from "@/components/lead-eoi/enquiry-form";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Have a query?",
  description:
    "Ask Haus of Estate about buying, renting, investing or our property services. Share your question and tell us how to reach you.",
  alternates: { canonical: "/enquire" },
  openGraph: {
    title: "Have a query? — Haus of Estate",
    description:
      "A property in mind, a plan taking shape, or just a question? Start a conversation with Haus of Estate.",
    url: "/enquire",
    type: "website",
    images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: "summary_large_image",
    title: "Have a query? — Haus of Estate",
    description:
      "Ask a question about property or tell us what you have in mind.",
    images: [DEFAULT_OG_IMAGES[0].url],
  },
};

export default function EnquirePage() {
  if (process.env.LEAD_INTAKE_ENABLED !== "true") notFound();

  return (
    <div className="bg-subtle">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <section className="self-start lg:sticky lg:top-28">
          <p className="text-xs font-semibold uppercase tracking-widest text-estate-700">
            Let’s talk property
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-estate-700 sm:text-5xl lg:text-6xl">
            Have a query?
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            A property in mind, a plan taking shape, or just a question? Tell us
            what you’re thinking. You don’t need to have it all figured out.
          </p>
          <div className="mt-7 flex items-start gap-3 border-l-2 border-gold-400 pl-4">
            <MessageSquareText
              className="mt-1 h-5 w-5 shrink-0 text-estate-700"
              aria-hidden="true"
            />
            <p className="max-w-sm text-sm leading-6 text-foreground">
              Ask about buying, renting, investing, selling or any of our
              services. We’ll use your details to respond to your question.
            </p>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No account needed. Email updates are your choice.
          </p>
          <div className="mt-8 hidden space-y-4 border-t border-border pt-6 text-sm sm:block">
            <a
              href="mailto:info@hausofestate.com"
              className="flex w-fit items-center gap-2 text-estate-700 underline-offset-4 hover:underline"
            >
              <Mail className="h-4 w-4" aria-hidden="true" /> Prefer email?
              Write to us
            </a>
            <Link
              href="/properties"
              className="flex w-fit items-center gap-2 text-estate-700 underline-offset-4 hover:underline"
            >
              Explore properties{" "}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section
          aria-label="Send a question to Haus of Estate"
          className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-8"
        >
          <EnquiryForm />
        </section>
      </div>
    </div>
  );
}
