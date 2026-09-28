import Image from "next/image";
import { Mail, Phone, Linkedin, Instagram, User } from "lucide-react";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/sanity/client";
import type { TeamMember } from "@/lib/team";
export type { TeamMember } from "@/lib/team";

interface TeamGridProps {
  members: TeamMember[];
  detailed?: boolean;
}

const socialClass = "flex h-11 w-11 items-center justify-center rounded-full border border-border text-estate-700 transition-colors hover:border-estate-700 hover:bg-estate-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2";

export function TeamGrid({ members, detailed = false }: TeamGridProps) {
  if (members.length === 0) return null;

  return (
    <div className={detailed ? "grid gap-8" : "grid max-w-sm gap-6"}>
      {members.map((m) => (
        <article key={m._id} id={m.slug}
          className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-sm ${detailed ? "grid md:grid-cols-[1fr_1.2fr]" : "flex flex-col"}`}>
          <div className="relative aspect-square overflow-hidden bg-white">
            {m.photo || m.localPhoto ? (
              <Image
                src={m.photo ? urlFor(m.photo).width(1000).url() : m.localPhoto!}
                alt={m.photo?.alt || `${m.name}, ${m.role} of Haus of Estate`}
                fill
                sizes={detailed ? "(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw" : "(min-width: 640px) 384px, 100vw"}
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-estate-700">
                <User className="h-16 w-16 text-white/30" />
              </div>
            )}
          </div>
          <div className={`flex flex-1 flex-col ${detailed ? "justify-center p-6 md:p-10" : "p-5"}`}>
            {m.department ? <p className="font-serif text-xs font-semibold uppercase tracking-widest text-gold-500">{m.department}</p> : null}
            <h2 className="mt-2 font-serif text-3xl font-medium text-estate-700">{m.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
            {detailed && m.fullBio?.length ? (
              <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
                <PortableText value={m.fullBio} />
              </div>
            ) : m.shortBio ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.shortBio}</p>
            ) : null}
            {m.markets?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {m.markets.map((market) => <span key={market} className="rounded-full bg-estate-700/10 px-3 py-1 text-xs text-estate-700">{market}</span>)}
              </div>
            ) : null}
            <div className="flex items-center gap-3 pt-6">
              {m.email ? <a href={`mailto:${m.email}`} aria-label={`Email ${m.name}`} className={socialClass}><Mail className="h-4 w-4" /></a> : null}
              {m.phone ? <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${m.name}`} className={socialClass}><Phone className="h-4 w-4" /></a> : null}
              {m.linkedinUrl ? <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn`} className={socialClass}><Linkedin className="h-4 w-4" /></a> : null}
              {m.instagramUrl ? <a href={m.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on Instagram`} className={socialClass}><Instagram className="h-4 w-4" /></a> : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
