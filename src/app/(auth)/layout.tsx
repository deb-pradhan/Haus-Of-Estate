import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <Image
            src="/Frame 16-1.svg"
            alt="Haus of Estate"
            width={160}
            height={86}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </div>
      {children}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Haus of Estate. All rights reserved.
      </p>
    </div>
  );
}
