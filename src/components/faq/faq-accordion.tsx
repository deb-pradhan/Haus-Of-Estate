"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PortableText } from "@portabletext/react";

export interface FaqItem {
  _id: string;
  question: string;
  slug?: string;
  category?: string;
  answer: unknown;
}

interface FaqAccordionProps {
  items: FaqItem[];
  /** Open the first item by default. */
  defaultOpenFirst?: boolean;
}

export function FaqAccordion({ items, defaultOpenFirst = false }: FaqAccordionProps) {
  const [open, setOpen] = useState<string | null>(
    defaultOpenFirst && items[0] ? items[0]._id : null,
  );

  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {items.map((item) => {
        const isOpen = open === item._id;
        return (
          <li key={item._id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${item._id}`}
              onClick={() => setOpen(isOpen ? null : item._id)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-estate-700/[0.03] focus-visible:bg-estate-700/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-estate-700/40"
            >
              <span className="font-serif text-base font-medium text-estate-700 md:text-lg">
                {item.question}
              </span>
              <ChevronDown
                aria-hidden
                className={`h-5 w-5 shrink-0 text-estate-700 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div
                id={`faq-panel-${item._id}`}
                className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground md:text-base"
              >
                <div className="prose prose-sm max-w-none text-muted-foreground prose-p:my-2 prose-strong:text-estate-700">
                  <PortableText value={item.answer as never} />
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
