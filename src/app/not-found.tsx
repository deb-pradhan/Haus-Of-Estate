import Link from 'next/link'

const WHATSAPP_URL =
  'https://wa.me/971585607033?utm_source=site&utm_medium=404&utm_campaign=whatsapp'

const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/properties', label: 'Properties' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-estate-700 px-4 py-24 text-center text-white">
      <p className="font-serif text-sm font-medium uppercase tracking-[0.3em] text-gold-400">
        Haus of Estate
      </p>

      <p className="mt-10 font-serif text-7xl font-semibold text-gold-400 md:text-8xl">
        404
      </p>

      <h1 className="mt-6 font-serif text-3xl font-medium leading-tight md:text-4xl">
        Page not found.
      </h1>

      <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 md:text-lg">
        The page you&apos;re looking for has moved or no longer exists. Let&apos;s
        get you back on track — or talk to a specialist directly.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-400"
      >
        Chat with us on WhatsApp
      </a>
    </div>
  )
}
