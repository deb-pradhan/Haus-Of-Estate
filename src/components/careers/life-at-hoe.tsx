"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { client, urlFor } from "@/sanity";
import { CULTURE_MOMENTS_QUERY } from "@/sanity/queries";

interface CultureMoment {
  _id: string;
  caption: string;
  photo: { alt?: string } & Record<string, unknown>;
  category?: string;
  takenOn?: string;
}

export function LifeAtHoE() {
  const [items, setItems] = useState<CultureMoment[] | null>(null);

  useEffect(() => {
    let active = true;
    client
      .fetch<CultureMoment[]>(CULTURE_MOMENTS_QUERY)
      .then((data) => {
        if (active) setItems(data ?? []);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Hide entire section until we have moments.
  if (items !== null && items.length === 0) return null;

  return (
    <section
      id="life-at-hoe"
      className="scroll-mt-32 bg-background px-4 py-16 md:px-6 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
            Life at Haus of Estate
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Behind the work, behind the people.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A small team across three continents, working in calm focus.
            A snapshot of office days, training, and the moments in between.
          </p>
        </div>

        {items === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <figure
                key={m._id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={urlFor(m.photo).width(800).height(1000).url()}
                    alt={m.photo.alt || m.caption}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
                  <p className="text-sm font-medium leading-snug">
                    {m.caption}
                  </p>
                  {m.category && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                      {m.category}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
