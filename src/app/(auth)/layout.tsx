import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <Link
          href="/"
          aria-label="Return to Haus of Estate home"
          className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/Frame 16-1.svg"
            alt="Haus of Estate"
            width={160}
            height={86}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </header>
      <main id="main-content" className="flex w-full justify-center">
        {children}
      </main>
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Haus of Estate. All rights reserved.
      </footer>
    </div>
  );
}
