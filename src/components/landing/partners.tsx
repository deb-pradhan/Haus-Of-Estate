"use client";

const PARTNERS = [
  "EMAAR",
  "DAMAC",
  "NAKHEEL",
  "SOBHA",
  "MERAAS",
  "DUBAI PROPERTIES",
];

export function Partners() {
  return (
    <section className="border-y border-border bg-subtle px-4 py-14 md:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
            Our developer partners
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium text-estate-700 md:text-3xl">
            Working with the names that define the skyline.
          </h2>
        </div>

        <ul className="grid grid-cols-2 items-center gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {PARTNERS.map((name) => (
            <li
              key={name}
              className="flex h-24 items-center justify-center bg-surface px-4 transition-colors hover:bg-estate-700/[0.03]"
            >
              <span className="font-serif text-base font-semibold uppercase tracking-[0.18em] text-estate-700/70 transition-colors hover:text-estate-700 md:text-lg">
                {name}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Partnerships shown reflect developers our agent network transacts with. Logos are
          the property of their respective owners.
        </p>
      </div>
    </section>
  );
}
