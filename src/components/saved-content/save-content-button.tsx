"use client";

import { Bookmark, Heart, Loader2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useSavedContent,
  type SavedContentType,
} from "./saved-content-provider";

export function SaveContentButton({
  contentType,
  sanityDocumentId,
  title,
  className,
  showLabel = false,
}: {
  contentType: SavedContentType;
  sanityDocumentId: string;
  title: string;
  className?: string;
  showLabel?: boolean;
}) {
  const { enabled, hydrated, isSaved, toggleSaved } = useSavedContent();
  const [pending, setPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  if (!enabled) return null;

  const saved = isSaved(contentType, sanityDocumentId);
  const collection = contentType === "PROPERTY" ? "properties" : "articles";
  const Icon = contentType === "PROPERTY" ? Heart : Bookmark;
  const action = saved ? `Remove ${title} from saved ${collection}` : `Save ${title}`;

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setPending(true);
    setAnnouncement("");
    try {
      const nextSaved = await toggleSaved(contentType, sanityDocumentId);
      setAnnouncement(nextSaved ? `${title} saved.` : `${title} removed from saved items.`);
    } catch {
      setAnnouncement("Could not update saved items. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className={cn("inline-flex", className)}>
      <Button
        type="button"
        variant="outline"
        size={showLabel ? "default" : "icon"}
        aria-label={action}
        aria-pressed={saved}
        title={action}
        disabled={!hydrated || pending}
        onClick={handleClick}
        className={cn(
          "min-h-11 min-w-11 border-border bg-surface/95 text-estate-700 shadow-sm backdrop-blur-sm hover:bg-surface",
          showLabel && "h-11 px-4",
        )}
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Icon
            className={cn("h-5 w-5", saved && "fill-estate-700")}
            aria-hidden="true"
          />
        )}
        {showLabel && <span>{saved ? "Saved" : "Save"}</span>}
      </Button>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </span>
  );
}
