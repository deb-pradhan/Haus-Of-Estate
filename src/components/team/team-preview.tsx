"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { client } from "@/sanity/client";
import { TEAM_MEMBERS_QUERY } from "@/sanity/queries";
import { TeamGrid } from "./team-grid";
import { approvedTeamMembers, type TeamMember } from "@/lib/team";

export function TeamPreview({ limit = 6 }: { limit?: number }) {
  const [members, setMembers] = useState<TeamMember[]>(() => approvedTeamMembers().slice(0, limit));
  useEffect(() => {
    let active = true;
    client.fetch<TeamMember[]>(TEAM_MEMBERS_QUERY, {}, { perspective: "published" })
      .then((data) => { if (active) setMembers(approvedTeamMembers(data).slice(0, limit)); })
      .catch(() => { /* Keep the approved founder profile during a CMS outage. */ });
    return () => { active = false; };
  }, [limit]);
  if (!members.length) return null;

  return (
    <section className="bg-background px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">Our team</p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">Meet the founder.</h2>
          </div>
          <Link href="/team" className="inline-flex items-center gap-1.5 text-sm font-medium text-estate-700 underline-offset-4 hover:underline">
            Meet Sonia <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <TeamGrid members={members} />
      </div>
    </section>
  );
}
