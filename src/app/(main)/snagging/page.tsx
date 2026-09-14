import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, Mail, MessageCircle, Ruler } from "lucide-react";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Snagging & Pre-handover Inspections",
  description: "Enquire about a pre-handover property inspection with Haus of Estate. Request a snagging quote for an apartment, villa, duplex, triplex or quadplex.",
  alternates: { canonical: "/snagging" },
  openGraph: {
    title: "Snagging & Pre-handover Inspections — Haus of Estate",
    description: "Request a property-specific quote for a pre-handover snagging inspection.",
    url: "/snagging",
    type: "website",
    images: DEFAULT_OG_IMAGES,
  },
};

const ENQUIRY = [
  "Hello Haus of Estate, I'd like a quote for a pre-handover snagging inspection.",
  "",
  "Property type (apartment, villa, duplex, triplex, quadplex or other):",
  "Bedrooms:",
  "Built-up / inspection area and unit (sq ft or sq m):",
  "Number of floors, if relevant:",
  "Location / development:",
  "Expected handover date:",
  "Name and preferred contact details:",
  "Anything else you'd like inspected:",
].join("\n");
const WHATSAPP_HREF = `https://wa.me/447496033321?text=${encodeURIComponent(ENQUIRY)}`;
const EMAIL_HREF = `mailto:info@hausofestate.com?subject=${encodeURIComponent("Snagging inspection quote")}&body=${encodeURIComponent(ENQUIRY)}`;

const QUOTE_DETAILS = [
  {
    icon: Building2,
    title: "Your property",
    text: "Tell us whether it is an apartment, villa, duplex, triplex or quadplex, along with its bedrooms and number of floors. Include anything unusual about the layout.",
  },
  {
    icon: Ruler,
    title: "The area to inspect",
    text: "Share the built-up or inspection area in square feet or square metres, rather than the plot size. Let us know about balconies, outside spaces or other areas you want included.",
  },
  {
    icon: CalendarDays,
    title: "Location and handover",
    text: "Include the location or development, your expected handover date and any access arrangements. If the date or area is not confirmed yet, tell us what you know.",
  },
];

export default function SnaggingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <section className="bg-estate-700 px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          <Link href="/services" className="text-sm text-white/80 underline underline-offset-4 hover:text-white">All services</Link>
          <p className="mt-8 font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">Snagging inspections</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-medium leading-tight text-white md:text-6xl">
            Before handover, <span className="text-gold-400">take a closer look.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Arrange a pre-handover property inspection with Haus of Estate. Tell us about your home and its handover plans so we can discuss a snagging quote tailored to the property.
          </p>
          <a href="#quote" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-md bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-gold-300">
            Request a snagging quote <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">A quote for your property.</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Inspection pricing depends on the property type, bedrooms and area, especially for villas. Share these details to help us prepare your quote.
          </p>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {QUOTE_DETAILS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-surface p-6 md:p-7">
                <Icon className="h-6 w-6 text-estate-700" aria-hidden="true" />
                <h3 className="mt-5 font-serif text-xl font-medium text-estate-700">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quote" className="scroll-mt-24 border-t border-border bg-surface px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">Tell us about your handover.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Start a quote enquiry by WhatsApp or email. Add your property details to the prepared message, then send it when you are ready. We will confirm the inspection scope, price and arrangements with you before booking.
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-estate-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-estate-600">
              <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
            </a>
            <a href={EMAIL_HREF} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-estate-700 px-6 py-3 text-sm font-semibold text-estate-700 transition-colors hover:bg-estate-700/5">
              <Mail className="h-4 w-4" /> Request a quote by email
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Prefer to talk? <a href="tel:+447496033321" className="font-medium text-estate-700 underline underline-offset-4">Call +44 7496 033321</a>.</p>
        </div>
      </section>
    </div>
  );
}
