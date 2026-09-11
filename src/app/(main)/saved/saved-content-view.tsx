"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Building2,
  CalendarDays,
  Heart,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SaveContentButton, useSavedContent } from "@/components/saved-content";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { urlFor } from "@/sanity";

interface SavedDocument {
  _id: string;
  _type: "property" | "post";
  title: string;
  slug: string;
  featuredImage?: unknown;
  subtitle?: string;
  summary?: string;
  publishedAt?: string;
  community?: string;
  city?: string;
  unitType?: string;
  bedrooms?: number;
  priceDisplay?: string;
  rentPriceDisplay?: string;
}

interface SavedItem {
  id: string;
  contentType: "PROPERTY" | "ARTICLE";
  sanityDocumentId: string;
  savedAt: string;
  content: SavedDocument;
}

function readItems(payload: unknown): SavedItem[] {
  if (typeof payload !== "object" || payload === null) return [];
  const items = Reflect.get(payload, "items");
  if (!Array.isArray(items)) return [];

  return items.filter((item): item is SavedItem => {
    if (typeof item !== "object" || item === null) return false;
    const content = Reflect.get(item, "content");
    return (
      (Reflect.get(item, "contentType") === "PROPERTY" ||
        Reflect.get(item, "contentType") === "ARTICLE") &&
      typeof Reflect.get(item, "sanityDocumentId") === "string" &&
      typeof content === "object" &&
      content !== null &&
      typeof Reflect.get(content, "title") === "string" &&
      typeof Reflect.get(content, "slug") === "string"
    );
  });
}

function savedImageUrl(content: SavedDocument): string | null {
  if (!content.featuredImage) return null;
  try {
    return urlFor(content.featuredImage).width(800).height(500).fit("crop").url();
  } catch {
    return null;
  }
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function SavedCard({ item }: { item: SavedItem }) {
  const isProperty = item.contentType === "PROPERTY";
  const href = isProperty
    ? `/properties/${item.content.slug}`
    : `/blog/${item.content.slug}`;
  const imageUrl = savedImageUrl(item.content);
  const articleDate = formatDate(item.content.publishedAt);
  const description = item.content.summary || item.content.subtitle;

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-estate-700/35 hover:shadow-lg">
      <Link
        href={href}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700/50 focus-visible:ring-inset"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-estate-700/8">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.content.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-estate-700/5 to-gold-400/15">
              {isProperty ? (
                <Building2 className="h-10 w-10 text-estate-700/30" />
              ) : (
                <Bookmark className="h-10 w-10 text-estate-700/30" />
              )}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-600">
            {isProperty ? item.content.unitType || "Property" : "Article"}
          </p>
          <h2 className="mt-2 line-clamp-2 font-serif text-xl font-medium leading-snug text-estate-700">
            {item.content.title}
          </h2>
          {description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            {isProperty ? (
              <>
                <span className="font-serif text-base font-semibold text-estate-700">
                  {item.content.priceDisplay ||
                    item.content.rentPriceDisplay ||
                    "Price on application"}
                </span>
                {(item.content.community || item.content.city) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[item.content.community, item.content.city]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  {articleDate && <CalendarDays className="h-3.5 w-3.5" />}
                  {articleDate || "Haus of Estate insights"}
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-estate-700">
                  Read <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      <SaveContentButton
        contentType={item.contentType}
        sanityDocumentId={item.sanityDocumentId}
        title={item.content.title}
        className="absolute right-3 top-3 z-10"
      />
    </article>
  );
}

function EmptySavedState({ type }: { type: "properties" | "articles" }) {
  const properties = type === "properties";
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-estate-700/8 text-estate-700">
        {properties ? <Heart className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
      </span>
      <h2 className="mt-4 font-serif text-xl font-medium text-estate-700">
        No saved {type} yet
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {properties
          ? "Use the heart on a property to keep it here for later."
          : "Use the bookmark on an article to build your reading list."}
      </p>
      <Button asChild className="mt-5 bg-estate-700 text-white hover:bg-estate-600">
        <Link href={properties ? "/properties" : "/blog"}>
          Browse {type} <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

export function SavedContentView() {
  const { revision } = useSavedContent();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/saved", {
        headers: { accept: "application/json" },
        signal,
      });
      if (!response.ok) throw new Error("Saved content lookup failed");
      setItems(readItems(await response.json()));
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
      setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, revision]);

  const properties = useMemo(
    () => items.filter((item) => item.contentType === "PROPERTY"),
    [items],
  );
  const articles = useMemo(
    () => items.filter((item) => item.contentType === "ARTICLE"),
    [items],
  );

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            Your shortlist
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Saved items
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Revisit properties and market insights you want to consider. Your account keeps them available across devices.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 md:py-14">
        {loading ? (
          <div aria-label="Loading saved items" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h2 className="font-serif text-xl font-medium text-estate-700">
              Saved items are temporarily unavailable
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your existing saves have not been changed.
            </p>
            <Button type="button" variant="outline" className="mt-5" onClick={() => void load()}>
              <RefreshCw /> Try again
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="properties">
            <TabsList aria-label="Saved content" className="mb-8 h-11">
              <TabsTrigger value="properties" className="min-h-10 px-4">
                <Heart /> Properties ({properties.length})
              </TabsTrigger>
              <TabsTrigger value="articles" className="min-h-10 px-4">
                <Bookmark /> Articles ({articles.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="properties">
              {properties.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {properties.map((item) => <SavedCard key={item.id} item={item} />)}
                </div>
              ) : (
                <EmptySavedState type="properties" />
              )}
            </TabsContent>
            <TabsContent value="articles">
              {articles.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((item) => <SavedCard key={item.id} item={item} />)}
                </div>
              ) : (
                <EmptySavedState type="articles" />
              )}
            </TabsContent>
          </Tabs>
        )}
      </section>
    </main>
  );
}
