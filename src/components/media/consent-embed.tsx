"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Click-to-load facade for third-party video embeds (YouTube / Vimeo).
 *
 * Nothing from the provider is requested, and no provider cookie can be set,
 * until the visitor presses the button. YouTube is loaded from the
 * privacy-enhanced youtube-nocookie.com domain; Vimeo with do-not-track on.
 *
 * Usage: <ConsentEmbed src={url} title="Walkthrough of 12 Example Road" />
 * `src` may be any YouTube or Vimeo watch/short/embed URL (see
 * lib/embed-video.ts), or an already-converted embed URL.
 */

type Provider = "youtube" | "vimeo";

function normalise(src: string): { provider: Provider; url: string } | null {
  const yt = src.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/,
  );
  if (yt) {
    return {
      provider: "youtube",
      url: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&autoplay=1`,
    };
  }
  const vm = src.match(/vimeo\.com\/(?:video\/)?(\d{5,})/);
  if (vm) {
    return {
      provider: "vimeo",
      url: `https://player.vimeo.com/video/${vm[1]}?dnt=1&autoplay=1`,
    };
  }
  return null;
}

interface ConsentEmbedProps {
  src: string | null | undefined;
  title: string;
  className?: string;
}

export function ConsentEmbed({ src, title, className }: ConsentEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const parsed = src ? normalise(src) : null;
  if (!parsed) return null;

  const providerName = parsed.provider === "youtube" ? "YouTube (Google)" : "Vimeo";

  if (loaded) {
    return (
      <div className={cn("relative aspect-video overflow-hidden rounded-2xl", className)}>
        <iframe
          src={parsed.url}
          title={title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-video flex-col items-center justify-center gap-4 rounded-2xl bg-estate-900 px-6 text-center text-white",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-gold-400 px-6 text-sm font-medium text-ink-900 shadow-e1 transition hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        Play video
      </button>
      <p className="max-w-md text-xs leading-relaxed text-white/75">
        This video is hosted by {providerName}. It loads only when you press play,
        and the provider may then set cookies. See our{" "}
        <Link href="/legal/cookie-policy" className="underline underline-offset-2">
          Cookie Policy
        </Link>
        .
      </p>
    </div>
  );
}
