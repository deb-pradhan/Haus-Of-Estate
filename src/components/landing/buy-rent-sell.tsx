import { HomepagePropertySearch } from "@/components/landing/homepage-property-search";

const STATS = [
  { value: "1,200+", label: "Clients matched since 2022" },
  { value: "15+", label: "Years' experience" },
  { value: "3", label: "Continents" },
  { value: "4.8★", label: "Average rating" },
];

export function BuyRentSell() {
  return (
    <section aria-label="Hero" className="relative overflow-hidden bg-estate-700">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #c4a87a 0, transparent 45%), radial-gradient(circle at 85% 80%, #c4a87a 0, transparent 40%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center md:px-6 md:py-28">
        <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
          UK · UAE · International
        </p>

        <p className="mx-auto mt-5 text-sm text-white/70 md:text-base">
          Welcome to Haus of Estate.
        </p>

        <h1 className="mx-auto mt-3 max-w-3xl font-serif text-[2.75rem] font-medium leading-[1.06] text-white md:text-[4rem] md:leading-[1.04]">
          Property in Dubai, the UK &amp; beyond —{" "}
          <span className="text-gold-400">with proof.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
          One enquiry connects you to the right vetted agent — transparent
          advice, no hidden fees, wherever you&apos;re moving capital.
        </p>

        <HomepagePropertySearch />

        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-10 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="font-serif text-3xl font-medium text-gold-400 md:text-4xl">
                {stat.value}
              </dt>
              <dd className="mt-1 text-xs uppercase tracking-[0.15em] text-white/60">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
