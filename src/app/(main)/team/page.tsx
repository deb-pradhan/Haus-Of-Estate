import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { sanityFetch } from '@/sanity'
import { TEAM_MEMBERS_QUERY } from '@/sanity/queries'
import { TeamGrid, type TeamMember } from '@/components/team/team-grid'

export const metadata: Metadata = {
  title: 'Team | Haus of Estate',
  description:
    'Meet the advisors, lettings specialists and operations team behind Haus of Estate.',
}

export const revalidate = 60

export default async function TeamPage() {
  const { data } = await sanityFetch<TeamMember[]>({ query: TEAM_MEMBERS_QUERY })
  const members = data ?? []

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            Our team
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] text-white md:text-5xl">
            Real people,{' '}
            <span className="text-gold-400">behind every introduction.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Property is a life-level decision. The advisors below are the ones
            who pick up the phone, sit through the second viewing, and answer
            on a Sunday when something feels off.
          </p>
        </div>
      </section>

      <section className="bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-estate-700/40" />
              <h2 className="mt-4 font-serif text-xl font-medium text-estate-700">
                Team profiles coming soon.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                We&apos;re finalising photos and bios. In the meantime, send
                an enquiry and we&apos;ll introduce you to the right advisor
                for your market.
              </p>
              <Link
                href="/#services"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-estate-600"
              >
                Speak to an advisor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <TeamGrid members={members} />
          )}
        </div>
      </section>
    </div>
  )
}
