"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ClipboardList,
  Sparkles,
  Sofa,
  PaintRoller,
  Users as UsersIcon,
  Briefcase,
  HelpCircle,
  Info,
  Home,
  Building2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLeadModals } from "@/components/lead-modal";
import { cn } from "@/lib/utils";
import {
  buildPropertiesMenu,
  type Category,
  type MenuColumn,
} from "@/lib/property-taxonomy";

const WHATSAPP_URL_HEADER =
  "https://wa.me/971585607033?utm_source=site&utm_medium=header&utm_campaign=whatsapp";
const COMPANY_EMAIL = "info@hausofestate.com";
const COMPANY_PHONES = [
  { region: "UAE", display: "+971 58 560 7033", href: "tel:+971585607033" },
  { region: "UK", display: "+44 7496 033321", href: "tel:+447496033321" },
] as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.79L.5 31.5l7.93-2.07A15.45 15.45 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28a12.45 12.45 0 0 1-6.36-1.74l-.46-.27-4.71 1.23 1.26-4.59-.3-.47A12.5 12.5 0 1 1 16 28.5zm6.86-9.36c-.38-.19-2.22-1.1-2.57-1.22-.34-.13-.59-.19-.84.19s-.96 1.22-1.18 1.47-.43.28-.81.09c-2.2-1.1-3.65-1.97-5.1-4.46-.39-.66.39-.62 1.11-2.05.13-.25.06-.47-.03-.66s-.84-2.03-1.15-2.78c-.3-.73-.61-.63-.84-.64h-.72c-.25 0-.66.09-1.01.47s-1.32 1.29-1.32 3.13 1.35 3.62 1.54 3.87c.19.25 2.66 4.06 6.45 5.69.9.39 1.6.62 2.15.79.9.29 1.72.25 2.37.15.72-.11 2.22-.91 2.53-1.78.31-.88.31-1.62.22-1.78s-.34-.25-.72-.44z" />
    </svg>
  );
}

// ─── Information architecture ─────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  desc?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavAction {
  action: "buyer" | "seller" | "account";
  label: string;
  desc?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

type ServiceEntry = NavItem | NavAction;

const SERVICES_ITEMS: ServiceEntry[] = [
  { href: "/services#property-management", label: "Property Management", desc: "Tenancy, maintenance and compliance, handled.", icon: ClipboardList },
  { href: "/services#staging", label: "Staging", desc: "Present a home for viewings, photography and marketing.", icon: Sparkles },
  { href: "/services#furnishing", label: "Furnishing", desc: "Move-in ready interiors for new builds and rentals.", icon: Sofa },
  { href: "/renovations", label: "Renovations", desc: "Painting, plumbing, decorating, electrical, flooring.", icon: PaintRoller },
];

const ABOUT_ITEMS: NavItem[] = [
  { href: "/about", label: "About us", desc: "Our story and the standard we hold.", icon: Info },
  { href: "/team", label: "Our team", desc: "The advisors behind every introduction.", icon: UsersIcon },
  { href: "/careers", label: "Careers", desc: "Jobs, internships and how to apply.", icon: Briefcase },
  { href: "/faq", label: "FAQs", desc: "Common questions, plain-English answers.", icon: HelpCircle },
];

// ─── Main component ────────────────────────────────────────────────────

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50">
      <TopUtilityBar />
      <header className="border-b border-[#DDE1E6] bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Haus of Estate — home">
            <Image
              src="/logo.svg"
              alt="Haus of Estate"
              width={140}
              height={36}
              className="h-7 w-auto md:h-8"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            <PropertiesMegaMenu pathname={pathname} />
            <NavDropdown
              label="Services"
              href="/services"
              items={SERVICES_ITEMS}
              pathname={pathname}
            />
            <NavLink href="/blog" label="Blogs" pathname={pathname} />
            <NavDropdown
              label="About"
              items={ABOUT_ITEMS}
              pathname={pathname}
            />
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            {/* Mobile / tablet trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="text-[#1E1F21] hover:bg-[#F7F5F1] hover:text-[#1F4F2F] lg:hidden"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto p-0">
                <MobileNav
                  pathname={pathname}
                  onClose={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </div>
  );
}

// ─── Top utility bar ───────────────────────────────────────────────────

function TopUtilityBar() {
  const { openAccount } = useLeadModals();
  return (
    <div className="hidden bg-estate-700 text-white/85 md:block">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 md:px-6">
        <p className="font-serif text-[11px] uppercase tracking-[0.22em] text-gold-400">
          UK · UAE · International
        </p>
        <div className="flex items-center gap-1">
          {COMPANY_PHONES.map((p, i) => (
            <span key={p.region} className="flex items-center gap-1">
              {i === 0 && <Phone className="ml-1 h-3.5 w-3.5 shrink-0 text-gold-400" />}
              <a
                href={p.href}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-white/10"
                title={`Call ${p.region}`}
              >
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-400/80">
                  {p.region}
                </span>
                <span>{p.display}</span>
              </a>
              {i < COMPANY_PHONES.length - 1 && (
                <span aria-hidden className="h-3 w-px bg-white/15" />
              )}
            </span>
          ))}
          <span aria-hidden className="h-3 w-px bg-white/15" />
          <a
            href={WHATSAPP_URL_HEADER}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center gap-1.5 rounded-md px-4 py-1 text-xs font-medium transition-colors hover:bg-white/10 md:min-h-0 md:px-2"
            title="WhatsApp"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 text-gold-400" />
            <span className="hidden xl:inline">WhatsApp</span>
          </a>
          <span aria-hidden className="hidden h-3 w-px bg-white/15 xl:inline-block" />
          <a
            href={`mailto:${COMPANY_EMAIL}`}
            className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-white/10 xl:flex"
            title="Email us"
          >
            <Mail className="h-3.5 w-3.5 text-gold-400" />
            <span>{COMPANY_EMAIL}</span>
          </a>
          <span aria-hidden className="h-3 w-px bg-white/15" />
          <button
            type="button"
            onClick={openAccount}
            className="rounded-md px-2 py-1 text-xs font-semibold text-gold-400 transition-colors hover:bg-white/10 hover:text-gold-300"
          >
            Speak to an advisor
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop nav primitives ────────────────────────────────────────────

function navLinkClasses(isActive: boolean) {
  return cn(
    "group relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ease-out",
    isActive
      ? "bg-estate-700/10 text-estate-700"
      : "text-[#4D5257] hover:bg-[#F7F5F1] hover:text-[#1E1F21]",
  );
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive =
    href === "/"
      ? pathname === "/"
      : href.startsWith("/#")
        ? false
        : pathname.startsWith(href);
  return (
    <Link href={href} className={navLinkClasses(isActive)}>
      {label}
    </Link>
  );
}

function NavDropdown({
  label,
  href,
  items,
  pathname,
}: {
  label: string;
  href?: string;
  items: ServiceEntry[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { openBuyer, openSeller, openAccount } = useLeadModals();

  // Active when any item href matches current path
  const isActive = items.some((item) => {
    if ("href" in item) {
      const href = item.href.split("#")[0];
      return href && pathname.startsWith(href) && href !== "/";
    }
    return false;
  });

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function runAction(action: NavAction["action"]) {
    setOpen(false);
    if (action === "buyer") openBuyer();
    else if (action === "seller") openSeller();
    else openAccount();
  }

  return (
    <div ref={rootRef} className="relative">
      {href ? (
        <div className={cn(navLinkClasses(isActive), "gap-0 pr-1")}>
          <Link
            href={href}
            onClick={() => setOpen(false)}
            className="rounded-md px-1 py-0.5 -mx-1"
          >
            {label}
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={`${label} menu`}
            onClick={() => setOpen((v) => !v)}
            className="ml-1 rounded-md p-0.5"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-150",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
          className={navLinkClasses(isActive)}
        >
          {label}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>
      )}
      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5"
        >
          <ul className="p-2">
            {items.map((item, i) => {
              const Icon = ("icon" in item && item.icon) || undefined;
              const body = (
                <span className="flex items-start gap-3">
                  {Icon && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-estate-700/8 text-estate-700">
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-estate-700">
                      {item.label}
                    </span>
                    {item.desc && (
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {item.desc}
                      </span>
                    )}
                  </span>
                </span>
              );
              return (
                <li key={i}>
                  {"href" in item ? (
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-estate-700/[0.04]"
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => runAction(item.action)}
                      className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-estate-700/[0.04]"
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Properties mega-menu (desktop) ────────────────────────────────────

const PROPERTIES_MENU = buildPropertiesMenu();

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  residential: Home,
  commercial: Building2,
};

const CATEGORY_TAGLINES: Record<Category, string> = {
  residential: "Homes, villas & investment residences.",
  commercial: "Offices, retail, hospitality & land.",
};

const BROWSE_BY_TYPE_HEADING = "Browse by type";

function ComingSoonTag() {
  return (
    <span className="shrink-0 rounded-full border border-border bg-subtle px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
      Coming soon
    </span>
  );
}

// Left-rail entry point — icon + label + tagline, activates the detail panel.
function MegaMenuRailItem({
  column,
  active,
  onActivate,
}: {
  column: MenuColumn;
  active: boolean;
  onActivate: () => void;
}) {
  const Icon = CATEGORY_ICONS[column.category];
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      className={cn(
        "group/rail relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        active ? "bg-estate-700/[0.06]" : "hover:bg-estate-700/[0.04]",
      )}
    >
      {/* Left accent for the active entry */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold-500 transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-estate-700/8 text-estate-700",
          column.muted && "opacity-60",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              column.muted ? "text-muted-foreground" : "text-estate-700",
            )}
          >
            {column.label}
          </span>
          {column.muted && <ComingSoonTag />}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {CATEGORY_TAGLINES[column.category]}
        </span>
      </span>
      <ChevronRight
        className={cn(
          "mt-1 h-4 w-4 shrink-0 self-start text-muted-foreground transition-all",
          active
            ? "translate-x-0 opacity-70"
            : "-translate-x-1 opacity-0 group-hover/rail:translate-x-0 group-hover/rail:opacity-50",
        )}
      />
    </button>
  );
}

// Right detail panel — shows ONLY the active category's options.
function MegaMenuDetail({
  column,
  onNavigate,
}: {
  column: MenuColumn;
  onNavigate: () => void;
}) {
  const availabilityGroups = column.groups.filter(
    (group) => group.heading !== BROWSE_BY_TYPE_HEADING,
  );
  const typeGroup = column.groups.find(
    (group) => group.heading === BROWSE_BY_TYPE_HEADING,
  );

  return (
    <div className="flex min-h-[20rem] flex-col p-5">
      {/* Availability sub-sections: Ready (To buy / To rent) + Off-Plan (To buy) */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {availabilityGroups.map((group) => (
          <div key={group.heading}>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.heading}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      "group/link flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-estate-700/[0.04]",
                      link.muted ? "text-muted-foreground/70" : "text-estate-700",
                    )}
                  >
                    <span className="whitespace-nowrap">{link.label}</span>
                    {link.muted && !column.muted ? (
                      <ComingSoonTag />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-60" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Browse by type — comfortable wrapped pill grid */}
      {typeGroup && (
        <div className="mt-5">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {typeGroup.heading}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeGroup.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  "whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-estate-700/30 hover:bg-estate-700/[0.04]",
                  link.muted ? "text-muted-foreground/70" : "text-estate-700",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* View all {category} */}
      <Link
        href={column.viewAllHref}
        onClick={onNavigate}
        className="group/all mt-auto inline-flex items-center gap-1 px-2 pt-5 text-xs font-semibold text-gold-600 underline-offset-4 hover:underline"
      >
        {column.viewAllLabel}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/all:translate-x-0.5" />
      </Link>
    </div>
  );
}

function PropertiesMegaMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("residential");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { openAccount } = useLeadModals();
  const isActive = pathname.startsWith("/properties");

  const activeColumn =
    PROPERTIES_MENU.find((column) => column.category === activeCategory) ??
    PROPERTIES_MENU[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <div className={cn(navLinkClasses(isActive), "gap-0 pr-1")}>
        <Link
          href="/properties"
          onClick={() => setOpen(false)}
          className="-mx-1 rounded-md px-1 py-0.5"
        >
          Properties
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Properties menu"
          onClick={() => {
            // Reset to the default entry point each time the menu opens.
            if (!open) setActiveCategory("residential");
            setOpen((v) => !v);
          }}
          className="ml-1 rounded-md p-0.5"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>
      </div>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-[46rem] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5"
        >
          <div className="flex">
            {/* Left rail — category entry points */}
            <div
              role="tablist"
              aria-label="Property categories"
              aria-orientation="vertical"
              className="w-56 shrink-0 border-r border-border bg-subtle/40 p-3"
            >
              <div className="space-y-1">
                {PROPERTIES_MENU.map((column) => (
                  <MegaMenuRailItem
                    key={column.category}
                    column={column}
                    active={column.category === activeCategory}
                    onActivate={() => setActiveCategory(column.category)}
                  />
                ))}
              </div>

              <div className="my-2 h-px bg-border" aria-hidden />

              <Link
                href="/properties"
                onClick={() => setOpen(false)}
                className="group/all-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-estate-700/[0.04]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-estate-700/8 text-estate-700">
                  <LayoutGrid className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-estate-700">
                    All properties
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    Browse the full portfolio.
                  </span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 self-start -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover/all-link:translate-x-0 group-hover/all-link:opacity-50" />
              </Link>
            </div>

            {/* Right detail — only the active category */}
            <div
              role="tabpanel"
              aria-label={activeColumn.label}
              className="min-w-0 flex-1"
            >
              <MegaMenuDetail
                column={activeColumn}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </div>

          {/* Footer strip — full-width browse-all + advisor CTA */}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-subtle/60 px-5 py-3">
            <Link
              href="/properties"
              onClick={() => setOpen(false)}
              className="group/footer inline-flex items-center gap-2 text-sm font-semibold text-estate-700 transition-colors hover:text-estate-600"
            >
              <Building2 className="h-4 w-4" />
              View all properties
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/footer:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openAccount();
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gold-600 transition-colors hover:bg-estate-700/[0.04]"
            >
              Speak to an advisor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mobile nav ────────────────────────────────────────────────────────

function MobileNav({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 px-4 pb-4 pt-12">
        <ul className="space-y-1">
          <MobilePropertiesGroup pathname={pathname} onClose={onClose} />
          <MobileGroup label="Services" defaultOpen items={SERVICES_ITEMS} onClose={onClose} />
          <MobileLink href="/blog" label="Blogs" pathname={pathname} onClose={onClose} />
          <MobileGroup label="About" items={ABOUT_ITEMS} onClose={onClose} />
          <MobileLink href="/contact" label="Contact" pathname={pathname} onClose={onClose} />
        </ul>

        {/* Contact strip */}
        <div className="my-5 h-px bg-[#DDE1E6]" />
        <ul className="space-y-1">
          {COMPANY_PHONES.map((p) => (
            <li key={p.region}>
              <a
                href={p.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-estate-700 transition-colors hover:bg-[#F7F5F1]"
              >
                <Phone className="h-4 w-4 text-gold-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold-600">
                  {p.region}
                </span>
                {p.display}
              </a>
            </li>
          ))}
          <li>
            <a
              href={WHATSAPP_URL_HEADER}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[#4D5257] transition-colors hover:bg-[#F7F5F1] hover:text-[#1FAE54]"
            >
              <WhatsAppIcon className="h-4 w-4 text-[#1FAE54]" />
              WhatsApp us
            </a>
          </li>
          <li>
            <a
              href={`mailto:${COMPANY_EMAIL}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#4D5257] transition-colors hover:bg-[#F7F5F1] hover:text-[#1F4F2F]"
            >
              <Mail className="h-4 w-4 text-gold-500" />
              {COMPANY_EMAIL}
            </a>
          </li>
        </ul>
      </div>

    </div>
  );
}

function MobilePropertiesGroup({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(pathname.startsWith("/properties"));

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[#1E1F21] transition-colors hover:bg-[#F7F5F1]"
      >
        Properties
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="mt-1 space-y-2 pl-2">
          {PROPERTIES_MENU.map((column) => (
            <MobilePropertyCategory
              key={column.category}
              column={column}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </li>
  );
}

function MobilePropertyCategory({
  column,
  onClose,
}: {
  column: MenuColumn;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[#F7F5F1]"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-estate-700">
            {column.label}
          </span>
          {column.muted && <ComingSoonTag />}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-2 pb-2 pl-3">
          {column.groups.map((group) => (
            <div key={group.heading}>
              <p className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group.heading}
              </p>
              <ul className="mt-0.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-estate-700/[0.05]",
                        link.muted
                          ? "text-muted-foreground/70"
                          : "text-estate-700",
                      )}
                    >
                      <span>{link.label}</span>
                      {link.muted && !column.muted && <ComingSoonTag />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            href={column.viewAllHref}
            onClick={onClose}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gold-600 underline-offset-4 hover:underline"
          >
            {column.viewAllLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function MobileLink({
  href,
  label,
  pathname,
  onClose,
}: {
  href: string;
  label: string;
  pathname: string;
  onClose: () => void;
}) {
  const isActive =
    href === "/"
      ? pathname === "/"
      : href.startsWith("/#")
        ? false
        : pathname.startsWith(href);
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-estate-700/10 text-estate-700"
            : "text-[#1E1F21] hover:bg-[#F7F5F1]",
        )}
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5 opacity-50" />
      </Link>
    </li>
  );
}

function MobileGroup({
  label,
  items,
  defaultOpen,
  onClose,
}: {
  label: string;
  items: ServiceEntry[];
  defaultOpen?: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const { openBuyer, openSeller, openAccount } = useLeadModals();

  function runAction(a: NavAction["action"]) {
    onClose();
    if (a === "buyer") openBuyer();
    else if (a === "seller") openSeller();
    else openAccount();
  }

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[#1E1F21] transition-colors hover:bg-[#F7F5F1]"
      >
        {label}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <ul className="mt-1 space-y-0.5 pl-2">
          {items.map((item, i) => {
            const Icon = ("icon" in item && item.icon) || undefined;
            const inner = (
              <span className="flex items-center gap-3">
                {Icon && <Icon className="h-4 w-4 text-estate-700" />}
                <span className="text-sm font-medium text-estate-700">
                  {item.label}
                </span>
              </span>
            );
            return (
              <li key={i}>
                {"href" in item ? (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block rounded-lg px-3 py-2 transition-colors hover:bg-estate-700/[0.05]"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => runAction(item.action)}
                    className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-estate-700/[0.05]"
                  >
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

