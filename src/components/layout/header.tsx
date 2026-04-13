"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLeadModals } from "@/components/lead-modal";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Services" },
  { href: "/#contact", label: "Contact" },
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
            const isActive = item.href === "/" 
              ? pathname === "/" 
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]",
                  isActive
                    ? "bg-[#1F4F2F]/10 text-[#1F4F2F]"
                    : "text-[#4D5257] hover:bg-[#F7F5F1] hover:text-[#1E1F21] hover:shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
                )}
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
                  const isHome = item.href === "/";
                  const isBlog = item.href === "/blog";
                  const isActive = isHome ? pathname === "/" : pathname.startsWith(isBlog ? "/blog" : "/") && isBlog ? true : false;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]",
                        pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                          ? "bg-[#1F4F2F]/10 text-[#1F4F2F]"
                          : "text-[#4D5257] hover:bg-[#F7F5F1] hover:text-[#1E1F21]",
                      )}
                    >
                      <span
                        className={cn(
                          "transition-transform duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-0.5",
                          pathname === item.href && "translate-x-0.5",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
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
