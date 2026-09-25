"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DEVELOPER_PARTNERS } from "@/lib/developer-partners";

export function Partners() {
  const id = useId();
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const element = track.current;
    if (!element) return;
    const start = element.scrollLeft <= 2;
    const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
    setEdges((current) => current.start === start && current.end === end ? current : { start, end });
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    return () => observer.disconnect();
  }, [updateEdges]);

  function move(direction: "previous" | "next" | "first" | "last") {
    const element = track.current;
    if (!element) return;
    const distance = element.clientWidth * (direction === "previous" ? -1 : 1);
    const left = direction === "first" ? 0 : direction === "last" ? element.scrollWidth : element.scrollLeft + distance;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left, behavior: reducedMotion ? "instant" : "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const directions = { ArrowLeft: "previous", ArrowRight: "next", Home: "first", End: "last" } as const;
    if (!(event.key in directions)) return;
    event.preventDefault();
    move(directions[event.key as keyof typeof directions]);
  }

  const controlClass = "inline-flex h-11 w-11 items-center justify-center rounded-full border border-estate-700/20 bg-white text-estate-700 transition-colors hover:bg-estate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-estate-700";

  return (
    <section aria-labelledby={`${id}-title`} className="overflow-hidden border-y border-border bg-subtle px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-estate-700/75">
              Our developer partners
            </p>
            <h2 id={`${id}-title`} className="mt-3 font-serif text-3xl font-medium leading-tight text-estate-700 md:text-4xl">
              Exceptional places.<br className="sm:hidden" /> Established names.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Explore the developers and destinations in our international network.
            </p>
          </div>
          <div className="flex items-center gap-2" aria-label="Partner carousel controls">
            <button type="button" aria-label="Previous developer partners" aria-controls={`${id}-track`} disabled={edges.start} onClick={() => move("previous")} className={controlClass}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next developer partners" aria-controls={`${id}-track`} disabled={edges.end} onClick={() => move("next")} className={controlClass}>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <ul
          ref={track}
          id={`${id}-track`}
          aria-label="Developer and destination partners"
          aria-describedby={`${id}-hint`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onScroll={updateEdges}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-2xl pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700 focus-visible:ring-offset-4 md:gap-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#b7c2b8 transparent" }}
        >
          {DEVELOPER_PARTNERS.map((partner) => (
            <li key={partner.name} className="w-[calc(50%-6px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-estate-700/10 bg-white sm:w-[calc((100%-24px)/3)] lg:w-[calc((100%-64px)/5)]">
              <div className={`relative flex h-32 items-center justify-center px-5 md:h-36 md:px-7 ${"dark" in partner && partner.dark ? "bg-estate-700" : "bg-white"}`}>
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={200}
                  height={100}
                  sizes="(max-width: 640px) 140px, 190px"
                  className={`w-full object-contain ${"stacked" in partner && partner.stacked ? "h-20" : "h-14"}`}
                />
              </div>
              <p className="border-t border-estate-700/10 px-3 py-3 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {partner.location}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
          <p id={`${id}-hint`}>Swipe to explore, or use the arrows. Keyboard: left/right, Home/End.</p>
          <p>Logos belong to their respective owners.</p>
        </div>
      </div>
    </section>
  );
}
