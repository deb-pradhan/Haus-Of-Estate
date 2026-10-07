import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { FaPinterestP, FaXTwitter } from "react-icons/fa6";
import type { ComponentType } from "react";
import { SOCIAL_PROFILES, type SocialProfileId } from "@/config/social";
import { cn } from "@/lib/utils";

const ICONS: Record<SocialProfileId, ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  pinterest: FaPinterestP,
  youtube: Youtube,
  x: FaXTwitter,
};

interface SocialProfileLinksProps {
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
  label?: string;
}

export function SocialProfileLinks({
  className,
  linkClassName,
  iconClassName,
  label = "Follow Haus of Estate",
}: SocialProfileLinksProps) {
  return (
    <nav aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {SOCIAL_PROFILES.map((profile) => {
        const Icon = ICONS[profile.id];
        return (
          <a
            key={profile.id}
            href={profile.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow Haus of Estate on ${profile.name}`}
            title={profile.name}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-estate-700 transition-colors hover:border-estate-700/40 hover:bg-estate-700/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              linkClassName,
            )}
          >
            <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
          </a>
        );
      })}
    </nav>
  );
}
