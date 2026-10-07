import Link from "next/link";

export function EnquiryUnavailable() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-estate-700">
        Contact Haus of Estate
      </p>
      <h1 className="mt-4 font-serif text-4xl text-estate-700">
        Online enquiries are temporarily unavailable.
      </h1>
      <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
        You can contact our team directly by email about buying, renting,
        selling or our property services.
      </p>
      <a
        href="mailto:info@hausofestate.com"
        className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-estate-700 px-5 py-3 font-medium text-white"
      >
        info@hausofestate.com
      </a>
      <p className="mt-6">
        <Link
          href="/properties"
          className="text-estate-700 underline underline-offset-4"
        >
          Continue browsing properties
        </Link>
      </p>
    </section>
  );
}
