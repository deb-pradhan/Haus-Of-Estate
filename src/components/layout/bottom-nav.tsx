"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, MessageSquare, Info, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeadModals } from "@/components/lead-modal/modal-context";

type Tab =
  | { kind: "link"; href: string; label: string; icon: typeof Home }
  | { kind: "action"; action: "buyer" | "account"; label: string; icon: typeof Home };

const TABS: Tab[] = [
  { kind: "link", href: "/", label: "Home", icon: Home },
  { kind: "link", href: "/blog", label: "Insights", icon: Newspaper },
  { kind: "action", action: "buyer", label: "Speak", icon: MessageSquare },
  { kind: "link", href: "/about", label: "About", icon: Info },
  { kind: "action", action: "account", label: "Account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openBuyer, openAccount } = useLeadModals();

  const isLinkActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {TABS.map((tab) => {
          if (tab.kind === "link") {
            const isActive = isLinkActive(tab.href);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-estate-700" : "text-muted-foreground"
                )}
              >
                <tab.icon
                  className={cn("h-5 w-5", isActive && "fill-estate-700/20")}
                />
                {tab.label}
              </Link>
            );
          }

          const onClick = tab.action === "buyer" ? openBuyer : openAccount;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={onClick}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-estate-700"
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
