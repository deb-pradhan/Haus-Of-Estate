import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface LegalPageProps {
  title: string;
  /** e.g. "18 October 2026" */
  updated: string;
  children: ReactNode;
}

/** Shared frame for the /legal/* pages so they look and behave the same. */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <Image
              src="/Frame 16-1.svg"
              alt="Haus of Estate"
              width={100}
              height={54}
              className="h-6 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
        <div className="mb-8">
          <p className="eyebrow mb-2">Legal</p>
          <h1 className="font-serif text-4xl font-medium text-estate-700">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        </div>
        <div className="space-y-8 text-sm leading-relaxed text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-serif text-xl font-medium text-estate-700">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
}

/** Responsive table wrapper with consistent styling. */
export function LegalTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[34rem] border-collapse text-left text-xs md:text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-stone-100">
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-semibold text-estate-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const legalLinkClass = "text-trust-teal underline-offset-2 hover:underline";
