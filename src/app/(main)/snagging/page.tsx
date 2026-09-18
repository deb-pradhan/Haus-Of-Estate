import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, Mail, MessageCircle, Ruler } from "lucide-react";
import { SnaggingBookingCalendar } from "@/components/snagging/booking-calendar";
import { DEFAULT_OG_IMAGES } from "@/lib/seo";
import { readSnaggingBookingConfig } from "@/lib/snagging-booking";

export const metadata: Metadata = {
  title: "Snagging Inspections & New-build Handover Checks",
  description: "Understand snagging, new-build defects and pre-handover inspections. Read Fatima's guide, get answers to common questions and discuss your property with Haus of Estate.",
  alternates: { canonical: "/snagging" },
  openGraph: {
    title: "Snagging Inspections & New-build Handover Checks — Haus of Estate",
    description: "A clearer understanding of your new home's condition before handover. Explore snagging checks, common questions and a quote for your property.",
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
const WHATSAPP_HREF = `https://wa.me/971585607033?text=${encodeURIComponent(ENQUIRY)}`;
const EMAIL_HREF = `mailto:info@hausofestate.com?subject=${encodeURIComponent("Snagging inspection quote")}&body=${encodeURIComponent(ENQUIRY)}`;

const SNAGGING_GUIDE_HREF = "/blog/snag-it-before-you-sign-it-the-uae-buyer-s-guide-to-snagging";

const SNAGGING_FAQS = [
  {
    question: "What does snagging mean?",
    answer: "Snagging means checking a property for defects, incomplete work and problems with the finish. An individual issue is called a snag. A snag list records what needs attention and where it is, so you can raise specific points with the developer or builder.",
  },
  {
    question: "Why inspect a home that is brand new?",
    answer: "New does not always mean everything is finished or working as expected. An inspection can identify issues such as damaged fittings or doors that do not close properly while you are preparing for handover. It also gives you a chance to compare the finished home with the agreed specification.",
  },
  {
    question: "What can a snagging inspection cover?",
    answer: "Areas to discuss include walls and floors, doors and windows, kitchens and bathrooms, and the operation of agreed fixtures and services. The checks depend on the property, access and the inspection you book. We will confirm the scope, any specialist testing and what is included in the report before booking.",
  },
  {
    question: "When should I arrange an inspection?",
    answer: "Get in touch when you know the expected handover or completion date, so there is time to discuss access and the inspection. Confirm with your developer when the property can be inspected. If you have already moved in, tell us when and which issues you have noticed so we can discuss the next steps.",
  },
  {
    question: "Is snagging the same as a pre-handover or pre-completion inspection?",
    answer: "These terms describe related checks, but the agreed scope matters more than the name. UK buyers may be offered a pre-completion inspection, while UAE buyers often discuss snagging before handover. Ask what will be checked, how findings will be recorded and which areas are excluded for your particular property.",
  },
  {
    question: "Can I enquire from the UK or overseas about a property in the UAE?",
    answer: "Yes. Tell us where the property is and where you are based, including your time zone. We will discuss whether we can arrange the service at that location and what access is needed. For a property in the UK or another country, please share its location so we can confirm the available options.",
  },
  {
    question: "How much does a snagging inspection cost?",
    answer: "Your quote depends on the property type, size, layout and agreed inspection scope. Share the number of bedrooms and the built-up or inspection area in square feet or square metres. A villa or a home across several floors may need different arrangements from an apartment.",
  },
  {
    question: "What happens after issues are found?",
    answer: "Keep a clear record of the issues and send it to the developer or builder in writing. Ask them to acknowledge it and explain the next steps. Discuss any follow-up inspection separately. Repair responsibilities and deadlines depend on your contract and the rules that apply where the property is located.",
  },
];

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
            Snagging inspections. <span className="text-gold-400">Know your home before handover.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            A new home can still have defects or unfinished work. A snagging inspection helps you identify issues to raise with the builder or developer. Speak to Haus of Estate about arranging a pre-handover inspection for your property.
          </p>
          <a href="#quote" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-md bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-gold-300">
            Request a snagging quote <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="border-b border-border bg-surface px-4 py-14 md:px-6 md:py-20" aria-labelledby="snagging-explained">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-estate-700">New-build property checks, explained</p>
            <h2 id="snagging-explained" className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">What are you looking for?</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Snagging is a close look at the condition and finish of a home. A chipped tile, a sticking window or a leaking tap might each go on a snag list. Recording the location and details makes it easier to explain what needs attention.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Before an inspection, discuss the areas to check, the agreed property specification and any concerns you already have. Ask how the findings will be recorded and whether further checks need a specialist.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Whether you call it snagging, a new-build defect inspection or a pre-handover check, start with a clear scope for your home and its location.
            </p>
          </div>
          <aside className="self-start rounded-2xl border border-border bg-canvas p-6 md:p-8" aria-labelledby="snagging-guide">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-estate-700">From our journal · UAE buyer guide</p>
            <h3 id="snagging-guide" className="mt-4 font-serif text-2xl font-medium leading-snug text-estate-700">
              Snag It Before You Sign It — The UAE Buyer&apos;s Guide to Snagging
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">By Fatima Rangwala · 17 August 2026</p>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Fatima walks through the handover process, common inspection areas and the importance of documenting what you find. Her guide focuses on buying in the UAE.
            </p>
            <Link href={SNAGGING_GUIDE_HREF} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-estate-700 underline underline-offset-4 hover:text-estate-600">
              Read Fatima&apos;s snagging guide <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
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

      <section className="border-t border-border px-4 py-14 md:px-6 md:py-20" aria-labelledby="snagging-faqs">
        <div className="mx-auto max-w-3xl">
          <h2 id="snagging-faqs" className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">Your snagging questions, answered.</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">A starting point for first-time buyers, new-build owners and people buying from overseas.</p>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {SNAGGING_FAQS.map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer rounded-sm pr-2 text-base font-semibold leading-relaxed text-estate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estate-700">
                  {question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Buying a new home in the UK? The <a href="https://www.nhqb.org.uk/resources/" target="_blank" rel="noopener noreferrer" className="font-medium text-estate-700 underline underline-offset-4">New Homes Quality Board&apos;s homebuyer guides</a> explain snagging and pre-completion inspections for buyers of homes from registered developers.
          </p>
        </div>
      </section>

      <SnaggingBookingCalendar config={readSnaggingBookingConfig()} />

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
