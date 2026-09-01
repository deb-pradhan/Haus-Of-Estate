"use client";

import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";
import { SocialProfileLinks } from "@/components/social/social-profile-links";

const COMPANY_PHONE_DISPLAY = "+44 7496 033321";
const COMPANY_PHONE_HREF = "tel:+447496033321";
const WHATSAPP_URL =
  "https://wa.me/447496033321?utm_source=site&utm_medium=footer&utm_campaign=whatsapp";
const COMPANY_EMAIL = "info@hausofestate.com";

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.79L.5 31.5l7.93-2.07A15.45 15.45 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28a12.45 12.45 0 0 1-6.36-1.74l-.46-.27-4.71 1.23 1.26-4.59-.3-.47A12.5 12.5 0 1 1 16 28.5zm6.86-9.36c-.38-.19-2.22-1.1-2.57-1.22-.34-.13-.59-.19-.84.19s-.96 1.22-1.18 1.47-.43.28-.81.09c-2.2-1.1-3.65-1.97-5.1-4.46-.39-.66.39-.62 1.11-2.05.13-.25.06-.47-.03-.66s-.84-2.03-1.15-2.78c-.3-.73-.61-.63-.84-.64h-.72c-.25 0-.66.09-1.01.47s-1.32 1.29-1.32 3.13 1.35 3.62 1.54 3.87c.19.25 2.66 4.06 6.45 5.69.9.39 1.6.62 2.15.79.9.29 1.72.25 2.37.15.72-.11 2.22-.91 2.53-1.78.31-.88.31-1.62.22-1.78s-.34-.25-.72-.44z" />
    </svg>
  );
}

export function Footer() {
  const { openBuyer, openSeller } = useLeadModals();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-estate-700 text-white/70">
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

          <p className="mt-4 text-xs leading-relaxed text-white/60">
            Rent Smart Wales Registered · Propertymark CMP Registered
          </p>

          {/* Quick actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openSeller}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-ink-900 transition-colors hover:bg-gold-400"
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
          <SocialProfileLinks
            className="mt-5"
            linkClassName="border-white/10 bg-white/5 text-white/70 hover:border-gold-500 hover:bg-gold-500 hover:text-white"
          />
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
          <FooterLink href="/blog">Blogs</FooterLink>
          <FooterLink href="/careers">Careers</FooterLink>
          <FooterLink href="/faq">FAQs</FooterLink>
          <FooterLink href="/contact">Contact us</FooterLink>
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
              {COMPANY_PHONE_DISPLAY}
            </a>
          </li>
          <li>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp us"
              className="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <WhatsAppGlyph />
              WhatsApp us
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-white/60 md:flex-row md:px-6">
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
      <h2 className="mb-4 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
        {title}
      </h2>
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
