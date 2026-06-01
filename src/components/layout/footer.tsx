"use client";

import Link from "next/link";
import { Star, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

const WHATSAPP_NUMBER = "+971 58 560 7033";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;
const COMPANY_EMAIL = "info@hausofestate.com";
const COMPANY_PHONE_HREF = "tel:+971585607033";

// Live social links. Instagram is intentionally omitted — the
// @hausofestate IG account is currently suspended; re-add once
// restored using the same shape:
//   { name: "Instagram", href: "https://www.instagram.com/hausofestate/", icon: ... }
const SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/haus-of-estate/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
    ),
  },
  {
    name: "X (Twitter)",
    href: "https://x.com/hausofestate",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/channel/UCXKr75hHkzX62I7cqhr7A6A",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    href: "https://www.pinterest.com/hausofestate/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
  },
];

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.79L.5 31.5l7.93-2.07A15.45 15.45 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28a12.45 12.45 0 0 1-6.36-1.74l-.46-.27-4.71 1.23 1.26-4.59-.3-.47A12.5 12.5 0 1 1 16 28.5zm6.86-9.36c-.38-.19-2.22-1.1-2.57-1.22-.34-.13-.59-.19-.84.19s-.96 1.22-1.18 1.47-.43.28-.81.09c-2.2-1.1-3.65-1.97-5.1-4.46-.39-.66.39-.62 1.11-2.05.13-.25.06-.47-.03-.66s-.84-2.03-1.15-2.78c-.3-.73-.61-.63-.84-.64h-.72c-.25 0-.66.09-1.01.47s-1.32 1.29-1.32 3.13 1.35 3.62 1.54 3.87c.19.25 2.66 4.06 6.45 5.69.9.39 1.6.62 2.15.79.9.29 1.72.25 2.37.15.72-.11 2.22-.91 2.53-1.78.31-.88.31-1.62.22-1.78s-.34-.25-.72-.44z" />
    </svg>
  );
}

export function Footer() {
  const { openAccount, openBuyer, openSeller } = useLeadModals();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-estate-700 text-white/70">
      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h3 className="font-serif text-2xl font-medium text-white md:text-3xl">
              Market intelligence, straight to your inbox.
            </h3>
            <p className="mt-1.5 text-sm text-white/60">
              Cross-border property insight. No spam — unsubscribe anytime.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              openAccount();
            }}
            className="flex w-full max-w-md items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 backdrop-blur-sm"
          >
            <input
              type="email"
              required
              placeholder="Your email address"
              aria-label="Your email address"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-400"
            >
              Subscribe <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main columns */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-5">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link
            href="/"
            aria-label="Haus of Estate — home"
            className="font-serif text-2xl font-medium tracking-wide text-white"
          >
            Haus of Estate
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            The international property service you can rely on. We connect
            buyers, landlords and investors with vetted agents across the UK,
            UAE and selected international markets.
          </p>

          <div className="mt-5 flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
              ))}
            </div>
            <span className="text-xs text-white/60">Rated 4.8 · Excellent</span>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-white/45">
            Rent Smart Wales Registered · Propertymark CMP Registered
          </p>

          {/* Quick actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openSeller}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gold-400"
            >
              Book Valuation <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
            >
              Browse properties <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Social icons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/70 transition-colors hover:bg-[#25D366] hover:text-white"
            >
              <WhatsAppGlyph />
            </a>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                title={s.name}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/70 transition-colors hover:bg-gold-500 hover:text-white"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Services */}
        <FooterCol title="Services">
          <FooterButton onClick={openBuyer}>Buy a property</FooterButton>
          <FooterButton onClick={openBuyer}>Rent a property</FooterButton>
          <FooterButton onClick={openSeller}>Sell or let</FooterButton>
          <FooterLink href="/renovations">Renovations</FooterLink>
          <FooterLink href="/list-property">List your property</FooterLink>
        </FooterCol>

        {/* Company */}
        <FooterCol title="Company">
          <FooterLink href="/about">About us</FooterLink>
          <FooterLink href="/team">Our team</FooterLink>
          <FooterLink href="/blog">Insights</FooterLink>
          <FooterLink href="/careers">Careers</FooterLink>
          <FooterLink href="/faq">FAQs</FooterLink>
          <FooterButton onClick={openAccount}>Contact us</FooterButton>
          <FooterLink href="/legal/privacy-policy">Privacy policy</FooterLink>
          <FooterLink href="/legal/terms-of-service">Terms of service</FooterLink>
          <FooterLink href="/legal/cookie-policy">Cookie policy</FooterLink>
        </FooterCol>

        {/* Contact */}
        <FooterCol title="Get in touch">
          <li>
            <a
              href={COMPANY_PHONE_HREF}
              className="flex items-center gap-2.5 text-sm font-semibold text-white transition-colors hover:text-gold-400"
            >
              <Phone className="h-4 w-4 shrink-0 text-gold-400" />
              {WHATSAPP_NUMBER}
            </a>
          </li>
          <li>
            <a
              href={`mailto:${COMPANY_EMAIL}`}
              className="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4 shrink-0 text-gold-400" />
              {COMPANY_EMAIL}
            </a>
          </li>
          <li>
            <a
              href="mailto:hr@hausofestate.com"
              className="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4 shrink-0 text-gold-400" />
              hr@hausofestate.com
            </a>
          </li>
          <li className="flex items-start gap-2.5 text-sm text-white/60">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
            Offices in the UK &amp; UAE — serving clients worldwide
          </li>
        </FooterCol>
      </div>

      {/* Legal bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-white/45 md:flex-row md:px-6">
          <span>&copy; {year} Haus of Estate. All rights reserved.</span>
          <span>UK English · Prices indicative · Subject to availability</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-4 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        {title}
      </h4>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-white/60 transition-colors hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}

function FooterButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="text-left text-sm text-white/60 transition-colors hover:text-white"
      >
        {children}
      </button>
    </li>
  );
}
