"use client";

import {
  Check,
  Copy,
  Link2,
  Mail,
  Share2,
} from "lucide-react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaPinterestP,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  buildShareIntentLinks,
  canonicalHausUrl,
  type ShareIntentLink,
} from "@/lib/share";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "error";
type ShareVariant = "button" | "rail";

const PLATFORM_ICONS: Record<
  ShareIntentLink["id"],
  ComponentType<{ className?: string }>
> = {
  whatsapp: FaWhatsapp,
  email: Mail,
  facebook: FaFacebookF,
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  pinterest: FaPinterestP,
};

const ICON_BUTTON_CLASS =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-estate-700 transition-colors hover:border-estate-700/40 hover:bg-estate-700/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface ContentShareProps {
  url: string;
  title: string;
  text?: string;
  contentLabel: string;
  variant?: ShareVariant;
  className?: string;
}

function isShareCancellation(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function ContentShare({
  url,
  title,
  text,
  contentLabel,
  variant = "button",
  className,
}: ContentShareProps) {
  const canonicalUrl = useMemo(() => canonicalHausUrl(url), [url]);
  const links = useMemo(
    () => buildShareIntentLinks({ url: canonicalUrl, title, text }),
    [canonicalUrl, text, title],
  );
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const manualCopyId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const updateCopyState = (state: CopyState) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setCopyState(state);
    if (state === "copied") {
      resetTimer.current = setTimeout(() => setCopyState("idle"), 2_000);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      updateCopyState("copied");
    } catch {
      updateCopyState("error");
      setFallbackOpen(true);
    }
  };

  const share = async () => {
    if (typeof navigator.share !== "function") {
      setFallbackOpen(true);
      return;
    }
    try {
      await navigator.share({ title, text, url: canonicalUrl });
    } catch (error) {
      if (!isShareCancellation(error)) setFallbackOpen(true);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setFallbackOpen(open);
    if (!open) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const feedback =
    copyState === "copied"
      ? "Link copied"
      : copyState === "error"
        ? "Clipboard unavailable. Copy the link below."
        : "";

  return (
    <div className={cn("relative", className)}>
      <Popover open={fallbackOpen} onOpenChange={handleOpenChange}>
        <PopoverAnchor asChild>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => void share()}
            aria-label={`Share ${contentLabel}`}
            aria-haspopup="dialog"
            aria-expanded={fallbackOpen}
            className={cn(
              ICON_BUTTON_CLASS,
              variant === "button" && "w-auto gap-2 px-4 text-sm font-medium",
            )}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {variant === "button" ? "Share" : null}
          </button>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          role="dialog"
          className="w-[min(20rem,calc(100vw-2rem))] p-3"
          aria-label={`Share ${contentLabel} options`}
        >
          <p className="px-1 text-sm font-semibold text-foreground">
            Share {contentLabel}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2" role="group">
            <button
              type="button"
              onClick={() => void copyLink()}
              aria-label="Copy link"
              title="Copy link"
              className={ICON_BUTTON_CLASS}
            >
              {copyState === "copied" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {links.map((link) => {
              const Icon = PLATFORM_ICONS[link.id];
              return (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Share via ${link.name}`}
                  title={link.name}
                  className={ICON_BUTTON_CLASS}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              );
            })}
          </div>
          {copyState === "error" ? (
            <div className="mt-3">
              <label
                htmlFor={manualCopyId}
                className="text-xs font-medium text-muted-foreground"
              >
                Copy this link manually
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-subtle px-2">
                <Copy className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  id={manualCopyId}
                  readOnly
                  value={canonicalUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none"
                />
              </div>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {variant === "rail" ? (
        <div
          className="mt-2 flex flex-col gap-2"
          role="group"
          aria-label={`Share ${contentLabel} directly`}
        >
          <button
            type="button"
            onClick={() => void copyLink()}
            aria-label="Copy link"
            title="Copy link"
            className={ICON_BUTTON_CLASS}
          >
            {copyState === "copied" ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          {links.map((link) => {
            const Icon = PLATFORM_ICONS[link.id];
            return (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share via ${link.name}`}
                title={link.name}
                className={ICON_BUTTON_CLASS}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            );
          })}
        </div>
      ) : null}

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "mt-2 min-h-4 text-xs text-muted-foreground",
          variant === "rail" && "sr-only",
        )}
      >
        {feedback}
      </p>
    </div>
  );
}
