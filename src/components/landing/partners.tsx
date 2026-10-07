"use client";

import Image from "next/image";
import { DEVELOPER_PARTNERS } from "@/lib/developer-partners";
import { usePartnerMotion } from "./use-partner-motion";

export function Partners() {
  const { windowRef, trackRef } = usePartnerMotion();
  return (
    <section aria-labelledby="developer-partners-title" className="partners-carousel overflow-hidden border-y border-border bg-subtle px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-estate-700/75">
            Our developer partners
          </p>
          <h2 id="developer-partners-title" className="mt-2 font-serif text-2xl font-medium leading-tight text-estate-700 md:text-3xl">
            Exceptional places.<br className="sm:hidden" /> Established names.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Explore our international developer network.
          </p>
        </div>

        <div ref={windowRef} className="partners-marquee-window" tabIndex={0} role="group" aria-label="Developer logos. Focus to pause; use arrow keys to explore.">
          <div ref={trackRef} className="partners-marquee-track">
            {[false, true].map((duplicate) => (
              <ul
                key={String(duplicate)}
                aria-label={duplicate ? undefined : "Developer and destination partners"}
                aria-hidden={duplicate || undefined}
                className="partners-marquee-group"
              >
                {DEVELOPER_PARTNERS.map((partner) => (
                  <li key={partner.name} className="w-36 shrink-0 overflow-hidden rounded-xl border border-estate-700/10 bg-white sm:w-44">
                    <div className={`flex h-20 items-center justify-center px-4 sm:h-24 sm:px-5 ${"dark" in partner && partner.dark ? "bg-estate-700" : "bg-white"}`}>
                      <Image
                        src={partner.logo}
                        alt={duplicate ? "" : partner.name}
                        width={200}
                        height={100}
                        sizes="(max-width: 640px) 112px, 136px"
                        draggable={false}
                        loading="eager"
                        className={`w-full object-contain ${"stacked" in partner && partner.stacked ? "h-16" : "h-12"}`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
