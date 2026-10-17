import { HomepagePropertySearch } from "@/components/landing/homepage-property-search";

/**
 * Homepage hero — "Quiet Confidence" (docs/mega-upgrade/DESIGN-PRINCIPLES.md).
 * One headline, one sentence, one search. Proof sits below the fold.
 */
export function BuyRentSell() {
  return (
    <section
      aria-label="Hero"
      className="relative isolate overflow-hidden bg-estate-900 text-white"
    >
      {/* Depth: layered gradients + a faint architectural grid, no stock imagery */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 50% -10%, #2c6a43 0%, #1f4f2f 38%, #0f2a19 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "96px 96px",
            maskImage:
              "radial-gradient(ellipse at 50% 30%, black 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 30%, black 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -top-40 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(196,168,122,0.55), transparent)",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-[min(46rem,calc(100svh-7rem))] max-w-5xl flex-col items-center justify-center px-5 py-20 text-center md:px-8 md:py-28">
        <p className="eyebrow eyebrow-dark animate-fade-up opacity-0-init">
          Dubai · United Kingdom · International
        </p>

        <h1
          className="animate-fade-up opacity-0-init mt-6 max-w-4xl font-serif text-display font-medium leading-[0.98] text-white"
          style={{ animationDelay: "80ms" }}
        >
          Property,{" "}
          <span className="text-gold-300">with proof.</span>
        </h1>

        <p
          className="animate-fade-up opacity-0-init mx-auto mt-6 max-w-2xl text-lede text-white/80"
          style={{ animationDelay: "160ms", lineHeight: 1.5 }}
        >
          International property in Dubai, the UK and beyond. One enquiry
          connects you with a local advisor — clear guidance from first
          conversation to completion.
        </p>

        <div
          className="animate-fade-up opacity-0-init w-full"
          style={{ animationDelay: "240ms" }}
        >
          <HomepagePropertySearch />
        </div>
      </div>
    </section>
  );
}
