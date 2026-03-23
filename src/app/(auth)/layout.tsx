import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-estate-700">
            <span className="text-sm font-bold text-white">H</span>
          </div>
          <span className="font-serif text-2xl font-semibold text-estate-700">
            Haus of Estate
          </span>
        </Link>
      </div>
      {children}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Haus of Estate. All rights reserved.
      </p>
    </div>
  );
}
