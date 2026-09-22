import type { Metadata } from 'next'
import { client, urlFor } from '@/sanity/client'
import { TEAM_MEMBERS_QUERY } from '@/sanity/queries'
import { TeamGrid } from '@/components/team/team-grid'
import { approvedTeamMembers, teamPersonSchema, type TeamMember } from '@/lib/team'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Meet the team',
  description: 'Meet Sonia Baig, Founder of Haus of Estate, connecting clients with property specialists across the UK, UAE and beyond.',
  alternates: { canonical: '/team' },
  openGraph: {
    title: 'Meet the team — Haus of Estate',
    description: 'Meet Sonia Baig, Founder of Haus of Estate.',
    url: '/team', type: 'website', images: DEFAULT_OG_IMAGES,
  },
}
export const revalidate = 60

export default async function TeamPage() {
  const records = await client.fetch<TeamMember[]>(TEAM_MEMBERS_QUERY, {}, {
    perspective: 'published', next: { revalidate: 60 },
  }).catch(() => null)
  const members = approvedTeamMembers(records)

  return (
    <div className="min-h-screen">
      {members.map((member) => (
        <script key={member._id} type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify(teamPersonSchema(member, member.photo
            ? urlFor(member.photo).width(1000).url() : member.localPhoto!)).replace(/</g, '\\u003c'),
        }} />
      ))}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">Our team</p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-white md:text-5xl">
            Meet the people behind <span className="text-gold-400">Haus of Estate.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            An introduction to our founder and the vision behind our international property service.
          </p>
        </div>
      </section>
      <section className="bg-background px-4 py-12 md:px-6 md:py-20" aria-label="Meet Sonia Baig">
        <div className="mx-auto max-w-6xl"><TeamGrid members={members} detailed /></div>
      </section>
    </div>
  )
}
