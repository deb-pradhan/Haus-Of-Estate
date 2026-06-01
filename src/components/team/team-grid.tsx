"use client";

import Image from "next/image";
import { Mail, Phone, Linkedin, User } from "lucide-react";
import { urlFor } from "@/sanity";

export interface TeamMember {
  _id: string;
  name: string;
  slug?: string;
  role: string;
  department?: string;
  photo?: { alt?: string } & Record<string, unknown>;
  shortBio?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  markets?: string[];
}

interface TeamGridProps {
  members: TeamMember[];
}

export function TeamGrid({ members }: TeamGridProps) {
  if (members.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <article
          key={m._id}
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-estate-700/40 hover:shadow-xl hover:shadow-estate-700/5"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-estate-700">
            {m.photo ? (
              <Image
                src={urlFor(m.photo).width(600).height(750).url()}
                alt={m.photo.alt || m.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-estate-600 to-estate-800">
                <User className="h-16 w-16 text-white/30" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            {m.department && (
              <p className="font-serif text-[11px] font-semibold uppercase tracking-widest text-gold-500">
                {m.department}
              </p>
            )}
            <h3 className="mt-1 font-serif text-xl font-medium text-estate-700">
              {m.name}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{m.role}</p>

            {m.shortBio && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {m.shortBio}
              </p>
            )}

            {m.markets && m.markets.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.markets.map((mk) => (
                  <span
                    key={mk}
                    className="rounded-full bg-estate-700/10 px-2 py-0.5 text-[11px] font-medium text-estate-700"
                  >
                    {mk}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center gap-2 pt-4">
              {m.email && (
                <a
                  href={`mailto:${m.email}`}
                  aria-label={`Email ${m.name}`}
                  title={m.email}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-estate-700 transition-colors hover:border-estate-700 hover:bg-estate-700 hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5" />
                </a>
              )}
              {m.phone && (
                <a
                  href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}
                  aria-label={`Call ${m.name}`}
                  title={m.phone}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-estate-700 transition-colors hover:border-estate-700 hover:bg-estate-700 hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
              {m.linkedinUrl && (
                <a
                  href={m.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${m.name} on LinkedIn`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-estate-700 transition-colors hover:border-estate-700 hover:bg-estate-700 hover:text-white"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
