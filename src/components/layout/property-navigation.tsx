"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { PROPERTY_MARKETS, marketLinks } from "@/lib/property-markets";
import { cn } from "@/lib/utils";

export function NavbarPropertySearch({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <form
      action="/properties"
      role="search"
      aria-label="Property search"
      onSubmit={onNavigate}
      className={cn(
        "flex min-w-0 items-center rounded-full border border-estate-700/20 bg-white focus-within:ring-2 focus-within:ring-estate-700/40",
        className,
      )}
    >
      <input
        type="search"
        name="q"
        aria-label="Search properties"
        placeholder="Search properties…"
        maxLength={120}
        className="min-w-0 flex-1 rounded-l-full bg-transparent py-2.5 pl-4 text-sm text-estate-700 placeholder:text-estate-700/55 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search properties"
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-estate-700 hover:bg-estate-700/5 focus-visible:outline-2 focus-visible:outline-estate-700"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

export function PropertiesCountryMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <div
      ref={root}
      className="static"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={() => {
        cancelClose();
        closeTimer.current = setTimeout(() => {
          if (
            !root.current
              ?.querySelector("#properties-country-menu")
              ?.contains(document.activeElement)
          )
            setOpen(false);
        }, 180);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="properties-country-menu"
        onClick={(event) => {
          cancelClose();
          setOpen(event.detail === 0 ? !open : true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() =>
              root.current
                ?.querySelector<HTMLAnchorElement>("#properties-country-menu a")
                ?.focus(),
            );
          }
        }}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-estate-700 transition-colors hover:bg-estate-700/5 focus-visible:outline-2 focus-visible:outline-estate-700",
          (open || pathname.startsWith("/properties")) && "bg-estate-700/10",
        )}
      >
        Properties{" "}
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id="properties-country-menu"
          className="absolute inset-x-0 top-full border-y border-estate-700/15 bg-white text-estate-700 shadow-xl shadow-estate-700/10"
        >
          <div className="mx-auto max-h-[calc(100dvh-8rem)] max-w-7xl overflow-y-auto px-6 py-8">
            <div className="mb-7 flex items-center justify-between border-b border-estate-700/10 pb-5">
              <p className="font-serif text-2xl">Find your place.</p>
              <Link
                href="/properties"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:underline"
              >
                All properties <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-10">
              {PROPERTY_MARKETS.map((market) => (
                <section key={market.country} aria-label={market.country}>
                  <h2 className="font-serif text-xl">{market.country}</h2>
                  <p className="mt-1 text-xs text-estate-700/65">
                    {market.detail}
                  </p>
                  <ul className="mt-4 space-y-1">
                    {marketLinks(market.country).map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          prefetch={false}
                          onClick={() => setOpen(false)}
                          className="group flex min-h-10 items-center justify-between rounded-lg px-3 text-sm hover:bg-estate-700/5 focus-visible:outline-2 focus-visible:outline-estate-700"
                        >
                          <span>{link.label}</span>
                          <ArrowRight
                            className="size-3.5 opacity-40 group-hover:opacity-100"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MobilePropertyMarkets({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  return (
    <li>
      <details className="group rounded-xl text-estate-700">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium">
          Properties <ChevronDown className="size-4 group-open:rotate-180" />
        </summary>
        <div className="space-y-2 pb-3">
          {PROPERTY_MARKETS.map((market) => (
            <details
              key={market.country}
              className="ml-2 rounded-xl border border-estate-700/10 bg-white"
            >
              <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold">
                {market.country}
              </summary>
              <ul className="px-3 pb-2">
                {marketLinks(market.country).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      onClick={onNavigate}
                      className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-estate-700/5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <Link
            href="/properties"
            onClick={onNavigate}
            className="flex min-h-11 items-center px-5 text-sm font-semibold"
          >
            Browse all properties <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>
      </details>
    </li>
  );
}
