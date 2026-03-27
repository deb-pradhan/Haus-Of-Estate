import Image from "next/image";
import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Search Properties", href: "/search" },
    { label: "How It Works", href: "#" },
    { label: "For Agents", href: "#" },
    { label: "Pricing", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-deep-olive text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4">
              <Image
                src="/Frame 16-2.svg"
                alt="Haus of Estate"
                width={120}
                height={64}
                className="h-21 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Property, with proof. The UAE&apos;s transaction-first real estate
              platform.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} Haus of Estate. All rights
          reserved. Dubai, UAE.
        </div>
      </div>
    </footer>
  );
}
