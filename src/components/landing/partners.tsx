"use client";

import Image from "next/image";
import { DEVELOPER_PARTNERS } from "@/lib/developer-partners";
import { usePartnerMotion } from "./use-partner-motion";

export function Partners() {
  const { sectionRef, windowRef, trackRef } = usePartnerMotion();
  return (
    <section ref={sectionRef} aria-labelledby="developer-partners-title" className="partners-carousel overflow-hidden border-y border-border bg-subtle px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-estate-700/75">
            Our developer partners
          </p>
          <h2 id="developer-partners-title" className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
            Exceptional places.<br className="sm:hidden" /> Established names.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Explore the developers and destinations in our international network.
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
                    <div className={`flex h-24 items-center justify-center px-4 sm:h-28 sm:px-5 ${"dark" in partner && partner.dark ? "bg-estate-700" : "bg-white"}`}>
                      <Image
                        src={partner.logo}
                        alt={duplicate ? "" : partner.name}
                        width={200}
                        height={100}
                        sizes="(max-width: 640px) 112px, 136px"
                        draggable={false}
                        loading="eager"
                        className={`w-full object-contain ${"stacked" in partner && partner.stacked ? "h-20" : "h-14"}`}
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
