"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLeadModals } from "@/components/lead-modal";
import { cn } from "@/lib/utils";

const WHATSAPP_URL = "https://wa.me/971585607033";
const COMPANY_EMAIL = "info@hausofestate.com";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.79L.5 31.5l7.93-2.07A15.45 15.45 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28a12.45 12.45 0 0 1-6.36-1.74l-.46-.27-4.71 1.23 1.26-4.59-.3-.47A12.5 12.5 0 1 1 16 28.5zm6.86-9.36c-.38-.19-2.22-1.1-2.57-1.22-.34-.13-.59-.19-.84.19s-.96 1.22-1.18 1.47-.43.28-.81.09c-2.2-1.1-3.65-1.97-5.1-4.46-.39-.66.39-.62 1.11-2.05.13-.25.06-.47-.03-.66s-.84-2.03-1.15-2.78c-.3-.73-.61-.63-.84-.64h-.72c-.25 0-.66.09-1.01.47s-1.32 1.29-1.32 3.13 1.35 3.62 1.54 3.87c.19.25 2.66 4.06 6.45 5.69.9.39 1.6.62 2.15.79.9.29 1.72.25 2.37.15.72-.11 2.22-.91 2.53-1.78.31-.88.31-1.62.22-1.78s-.34-.25-.72-.44z" />
    </svg>
  );
}

type NavItem =
  | { kind: "link"; href: string; label: string }
  | { kind: "modal"; label: string };

const navItems: NavItem[] = [
  { kind: "link", href: "/", label: "Home" },
  { kind: "link", href: "/blog", label: "Insights" },
  { kind: "link", href: "/about", label: "About" },
  { kind: "link", href: "/#services", label: "Services" },
  { kind: "link", href: "/renovations", label: "Renovations" },
  { kind: "modal", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openAccount } = useLeadModals();

  return (
    <header className="sticky top-0 z-50 border-b border-[#DDE1E6] bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Haus of Estate"
            width={140}
            height={36}
            className="h-7 w-auto md:h-8"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const baseClass =
              "group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]";
            const inactive =
              "text-[#4D5257] hover:bg-[#F7F5F1] hover:text-[#1E1F21] hover:shadow-[0_1px_2px_rgba(0,0,0,0.06)]";
            const active = "bg-[#1F4F2F]/10 text-[#1F4F2F]";

            if (item.kind === "modal") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={openAccount}
                  className={cn(baseClass, inactive)}
                >
                  <span className="transition-transform duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.02]">
                    {item.label}
                  </span>
                </button>
              );
            }

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/#")
                  ? false
                  : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(baseClass, isActive ? active : inactive)}
              >
                <span
                  className={cn(
                    "transition-transform duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.02]",
                    isActive && "scale-[1.02]",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            title="Chat with us on WhatsApp"
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/10 text-[#1FAE54] transition-colors hover:bg-[#25D366] hover:text-white md:flex"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
          </a>
          <a
            href={`mailto:${COMPANY_EMAIL}`}
            aria-label={`Email us at ${COMPANY_EMAIL}`}
            title={COMPANY_EMAIL}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#4D5257] transition-colors hover:bg-[#F7F5F1] hover:text-[#1F4F2F] md:flex"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden lg:inline">{COMPANY_EMAIL}</span>
          </a>
          <Button
            onClick={openAccount}
            size="sm"
            className="hidden bg-[#1F4F2F] text-white hover:bg-[#275E3B] active:bg-[#1a4530] md:flex transition-all duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] shadow-[0_1px_3px_rgba(31,79,47,0.3)] hover:shadow-[0_4px_12px_rgba(31,79,47,0.25)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <User className="mr-1.5 h-4 w-4" />
            Sign In
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-[#1E1F21] hover:bg-[#F7F5F1] hover:text-[#1F4F2F] transition-all duration-[120ms]"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col gap-1 p-4 pt-12">
                {navItems.map((item) => {
                  const itemBase =
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]";
                  const inactiveItem =
                    "text-[#4D5257] hover:bg-[#F7F5F1] hover:text-[#1E1F21]";
                  const activeItem = "bg-[#1F4F2F]/10 text-[#1F4F2F]";

                  if (item.kind === "modal") {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          openAccount();
                        }}
                        className={cn(itemBase, inactiveItem, "text-left")}
                      >
                        <span className="transition-transform duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-0.5">
                          {item.label}
                        </span>
                      </button>
                    );
                  }

                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : item.href.startsWith("/#")
                        ? false
                        : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(itemBase, isActive ? activeItem : inactiveItem)}
                    >
                      <span
                        className={cn(
                          "transition-transform duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-0.5",
                          isActive && "translate-x-0.5",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
                <div className="my-2 h-px bg-[#DDE1E6]" />
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#4D5257] transition-colors hover:bg-[#F7F5F1] hover:text-[#1FAE54]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp us
                </a>
                <a
                  href={`mailto:${COMPANY_EMAIL}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#4D5257] transition-colors hover:bg-[#F7F5F1] hover:text-[#1F4F2F]"
                >
                  <Mail className="h-4 w-4" />
                  {COMPANY_EMAIL}
                </a>
                <div className="my-2 h-px bg-[#DDE1E6]" />
                <Button
                  onClick={() => {
                    openAccount();
                    setMobileOpen(false);
                  }}
                  className="w-full bg-[#1F4F2F] text-white hover:bg-[#275E3B] active:bg-[#1a4530] transition-all duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]"
                >
                  <User className="mr-1.5 h-4 w-4" />
                  Sign In
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
