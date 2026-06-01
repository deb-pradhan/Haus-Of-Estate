"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { client } from "@/sanity";
import { TEAM_MEMBERS_QUERY } from "@/sanity/queries";
import { TeamGrid, type TeamMember } from "./team-grid";

interface TeamPreviewProps {
  /** How many members to show. */
  limit?: number;
}

export function TeamPreview({ limit = 6 }: TeamPreviewProps) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    let active = true;
    client
      .fetch<TeamMember[]>(TEAM_MEMBERS_QUERY)
      .then((data) => {
        if (active) setMembers((data ?? []).slice(0, limit));
      })
      .catch(() => {
        if (active) setMembers([]);
      });
    return () => {
      active = false;
    };
  }, [limit]);

  // Hide entire section until we have at least one member.
  if (members !== null && members.length === 0) return null;

  return (
    <section className="bg-background px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
              Our team
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              The people you&apos;ll actually deal with.
            </h2>
          </div>
          <Link
            href="/team"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-estate-700 underline-offset-4 hover:underline"
          >
            See the full team <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {members === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : (
          <TeamGrid members={members} />
        )}
      </div>
    </section>
  );
}
