/**
 * Loading skeletons for route-level `loading.tsx` files.
 *
 * NOT wired to a `loading.tsx` yet on purpose: a `loading.tsx` creates a Suspense
 * boundary that flushes a 200 before a page can call `notFound()`, so dynamic
 * routes (e.g. /blog/[slug], /properties/[slug]) would return a soft-404 (HTTP
 * 200 + noindex meta) instead of a real 404. Verify on a production build that
 * `curl -I /blog/does-not-exist` still returns 404, then enable with:
 *
 *   // src/app/(main)/loading.tsx
 *   export { PageSkeleton as default } from "@/components/error/page-skeleton";
 *
 * Safe to use today as an explicit `<Suspense fallback={<PageSkeleton />}>`
 * around slow, non-`notFound()` sections.
 */
export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-[1200px] px-4 py-16 md:py-24"
    >
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="space-y-6">
        <div className="h-3 w-28 animate-pulse rounded-full bg-gold-700/20 motion-reduce:animate-none" />
        <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-estate-700/10 motion-reduce:animate-none" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-estate-700/10 motion-reduce:animate-none" />
        <div className="grid gap-5 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-[20px] bg-estate-700/10 motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] items-center justify-center bg-canvas"
    >
      <span className="sr-only">Loading…</span>
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-2 border-estate-700/20 border-t-estate-700 motion-reduce:animate-none"
      />
    </div>
  );
}
