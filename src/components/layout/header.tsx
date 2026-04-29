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

type NavItem =
  | { kind: "link"; href: string; label: string }
  | { kind: "modal"; label: string };

const navItems: NavItem[] = [
  { kind: "link", href: "/", label: "Home" },
  { kind: "link", href: "/blog", label: "Insights" },
  { kind: "link", href: "/about", label: "About" },
  { kind: "link", href: "/#services", label: "Services" },
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
