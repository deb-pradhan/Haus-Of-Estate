"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePropertyAssistant } from "./property-assistant-provider";

export function PropertyAssistantSearchEntry() {
  const { enabled, openAssistant } = usePropertyAssistant();
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!enabled) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (!value) return;
    openAssistant(value, inputRef.current);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-10 border-b border-border pb-10"
      role="search"
      aria-label="Ask Haus about properties"
    >
      <label
        htmlFor="property-assistant-search"
        className="mb-2 block text-sm font-semibold text-estate-700"
      >
        Search in your own words
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Sparkles
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="property-assistant-search"
            value={question}
            onChange={(event) => setQuestion(event.target.value.slice(0, 1_000))}
            placeholder="Try: ready two-bedroom homes in Dubai"
            className="h-12 w-full rounded-md border border-border bg-surface pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-estate-700 focus:ring-2 focus:ring-estate-700/15"
          />
        </div>
        <button
          type="submit"
          disabled={!question.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-estate-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-estate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask Haus <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
