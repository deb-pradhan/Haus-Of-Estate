import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

const footerLinks = {
  Services: [
    { label: "Buy Property", href: "/" },
    { label: "Rent Property", href: "/" },
    { label: "Sell Property", href: "/list-property" },
    { label: "List Your Property", href: "/list-property" },
    { label: "Manage Property", href: "/" },
  ],
  Company: [
    { label: "About Us", href: "/#about" },
    { label: "Careers", href: "/" },
    { label: "Contact", href: "/#contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/legal/privacy-policy" },
    { label: "Terms of Service", href: "/legal/terms-of-service" },
    { label: "Cookie Policy", href: "/legal/cookie-policy" },
  ],
};

const SOCIAL_LINKS = [
  {
    name: "YouTube",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 1.5 6.2C1 8.1 1 12 1 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C23 15.9 23 12 23 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M24 12.7a12 12 0 0 1-12 12A12 12 0 0 1 0 12.7a12 12 0 0 1 12-12A12 12 0 0 1 24 12.7v.6a9.2 9.2 0 0 0 2.3.6A1.4 1.4 0 0 0 27 12.5v-.1a9.4 9.4 0 0 0-2.7-6.6A9.4 9.4 0 0 0 12 1a9.4 9.4 0 0 0-9.4 9.4 9.4 9.4 0 0 0 5.8 8.6v.6A1.4 1.4 0 0 0 9.7 20a9.4 9.4 0 0 0 9.4-9.4v-.6A9.2 9.2 0 0 0 21.7 13z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Snapchat",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M12.2 2.2a1.4 1.4 0 0 0-1.4 1.4v3.8a5.6 5.6 0 0 0-1.8.8l-2.1-1.1a1.4 1.4 0 0 0-1.2 0 1.4 1.4 0 0 0-.5 1.2v3.8a5.6 5.6 0 0 0-1.6 1.1l-2-1.2a1.4 1.4 0 0 0-1.2 0 1.4 1.4 0 0 0-.5 1.2v3.5a1.4 1.4 0 0 0 1.4 1.4 7 7 0 0 0 6 6.9 1.4 1.4 0 0 0 1.4-1.4v-3.7a5.6 5.6 0 0 0 2.3-.8l2 1.2a1.4 1.4 0 0 0 1.2.5 1.4 1.4 0 0 0 1.4-1.4v-3.5a5.6 5.6 0 0 0 2-1.3l2.3 1.4a1.4 1.4 0 0 0 1.2.5 1.4 1.4 0 0 0 1.4-1.4v-3.8a1.4 1.4 0 0 0-.5-1.2 1.4 1.4 0 0 0-1.2-.5l-2 .8a5.6 5.6 0 0 0-2.3-1.6V3.6a1.4 1.4 0 0 0-1.4-1.4z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M20.4 4.5a4 4 0 0 1 0 7.75V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.25a2 2 0 0 1 2-2h11.5zm-8.1 1.5h2.4v11.4H12.3zm-1.1-3.1a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M19.6 6.7a5.4 5.4 0 0 1-5.4-5.4h-3.5v14.7a5.4 5.4 0 1 1-5.4-5.4v-9.3" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M17.5 15.4a7.3 7.3 0 0 1-3.3.9 7.4 7.4 0 0 1-7.9-7.4 7.4 7.4 0 0 1 7.4-7.4 7.4 7.4 0 0 1 7.4 7.4c0 1.2-.3 2.3-.8 3.3l-.4-1.4zM12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9zm5.3 12.7a1.1 1.1 0 0 1-1.6.7l-1.6-.7-1.6.6a5.6 5.6 0 0 1-5.5-5.5c0-.3 0-.6.1-.9l.6-1.5-1.5-1.6a1.1 1.1 0 0 1 .7-1.6h1.6l.7 1.6 1.6-.6a5.6 5.6 0 0 1 0 5.5l-1.6.6-.7 1.6 1.6.7a1.1 1.1 0 0 1 .7 1.6l-.7 1.6z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-stone-100">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <Image
                src="/Frame 16-1.svg"
                alt="Haus of Estate"
                width={120}
                height={64}
                className="h-7 w-auto"
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The international real estate you can rely on. UK | UAE | International Presence.
            </p>

            {/* Social links */}
            <div className="mt-5 flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-estate-700 hover:text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Reviews */}
            <div className="mt-5 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">4.8 Excellent</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Haus of Estate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
