import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity'

interface AuthorCardProps {
  author: {
    name: string
    slug?: string
    avatar?: any
    role?: string
    bio?: string
    social?: {
      linkedin?: string
      twitter?: string
      email?: string
    }
  }
  variant?: 'compact' | 'full'
}

export function AuthorCard({ author, variant = 'compact' }: AuthorCardProps) {
  const avatarUrl = author.avatar ? urlFor(author.avatar).width(128).height(128).url() : null

  if (variant === 'full') {
    return (
      <div className="flex gap-6 rounded-xl border border-border bg-surface p-6">
        {avatarUrl && (
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
            <Image
              src={avatarUrl}
              alt={author.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gold-500">Written by</p>
          <h3 className="mt-1 font-serif text-xl text-ink-900">{author.name}</h3>
          {author.role && <p className="mt-0.5 text-sm text-slate-700">{author.role}</p>}
          {author.bio && <p className="mt-3 text-sm text-slate-700 leading-relaxed">{author.bio}</p>}
          {(author.social?.linkedin || author.social?.twitter || author.social?.email) && (
            <div className="mt-4 flex gap-3">
              {author.social.linkedin && (
                <a
                  href={author.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 transition-colors hover:text-estate-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              )}
              {author.social.twitter && (
                <a
                  href={author.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 transition-colors hover:text-estate-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {author.social.email && (
                <a
                  href={`mailto:${author.social.email}`}
                  className="text-slate-700 transition-colors hover:text-estate-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {avatarUrl && (
        <div className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image src={avatarUrl} alt={author.name} fill className="object-cover" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-ink-900">{author.name}</p>
        {author.role && <p className="text-xs text-slate-700">{author.role}</p>}
      </div>
    </div>
  )
}