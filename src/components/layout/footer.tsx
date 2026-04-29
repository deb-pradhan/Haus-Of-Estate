"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

const WHATSAPP_NUMBER = "+971 58 560 7033";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

const SOCIAL_LINKS = [
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
    name: "LinkedIn",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M20.4 4.5a4 4 0 0 1 0 7.75V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.25a2 2 0 0 1 2-2h11.5zm-8.1 1.5h2.4v11.4H12.3zm-1.1-3.1a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
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
    name: "WhatsApp",
    href: WHATSAPP_URL,
    icon: (
      <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current">
        <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.79L.5 31.5l7.93-2.07A15.45 15.45 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28a12.45 12.45 0 0 1-6.36-1.74l-.46-.27-4.71 1.23 1.26-4.59-.3-.47A12.5 12.5 0 1 1 16 28.5zm6.86-9.36c-.38-.19-2.22-1.1-2.57-1.22-.34-.13-.59-.19-.84.19s-.96 1.22-1.18 1.47-.43.28-.81.09c-2.2-1.1-3.65-1.97-5.1-4.46-.39-.66.39-.62 1.11-2.05.13-.25.06-.47-.03-.66s-.84-2.03-1.15-2.78c-.3-.73-.61-.63-.84-.64h-.72c-.25 0-.66.09-1.01.47s-1.32 1.29-1.32 3.13 1.35 3.62 1.54 3.87c.19.25 2.66 4.06 6.45 5.69.9.39 1.6.62 2.15.79.9.29 1.72.25 2.37.15.72-.11 2.22-.91 2.53-1.78.31-.88.31-1.62.22-1.78s-.34-.25-.72-.44z" />
      </svg>
    ),
  },
];

export function Footer() {
  const { openAccount, openBuyer, openSeller } = useLeadModals();

  return (
    <footer className="border-t border-border bg-stone-100">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block" aria-label="Haus of Estate — home">
              <Image
                src="/Frame 16-1.svg"
                alt="Haus of Estate"
                width={240}
                height={128}
                className="h-12 w-auto md:h-14"
                priority={false}
              />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              The international property service you can rely on. UK · UAE · International.
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
              <span className="text-xs text-muted-foreground">Rated 4.8 · Excellent</span>
            </div>
          </div>

          {/* Services — buttons that open lead modals */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Services
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={openBuyer}
                  className="text-left text-muted-foreground transition-colors hover:text-foreground"
                >
                  Buy a property
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openBuyer}
                  className="text-left text-muted-foreground transition-colors hover:text-foreground"
                >
                  Rent a property
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openSeller}
                  className="text-left text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sell or let your property
                </button>
              </li>
              <li>
                <Link
                  href="/list-property"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  List your property
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Insights
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openAccount}
                  className="text-left text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact us
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms-of-service"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookie-policy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cookie policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Haus of Estate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
