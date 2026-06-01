"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { client } from "@/sanity";
import { FEATURED_FAQS_QUERY } from "@/sanity/queries";
import { FaqAccordion, type FaqItem } from "@/components/faq/faq-accordion";

export function HomepageFaq() {
  const [items, setItems] = useState<FaqItem[] | null>(null);

  useEffect(() => {
    let active = true;
    client
      .fetch<FaqItem[]>(FEATURED_FAQS_QUERY)
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

  // Hide section entirely until we have at least one FAQ.
  if (items !== null && items.length === 0) return null;

  return (
    <section className="bg-background px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
            Common questions
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Straight answers, no jargon.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            A handful of the questions we hear most often. Find your answer
            below, or see the full FAQ.
          </p>
        </div>

        {items === null ? (
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface" />
        ) : (
          <FaqAccordion items={items} defaultOpenFirst />
        )}

        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-estate-700 underline-offset-4 hover:underline"
          >
            See the full FAQ <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
