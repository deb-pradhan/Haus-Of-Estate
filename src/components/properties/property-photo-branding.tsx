import Image from 'next/image'

/** A display layer only: the property photograph and its original asset stay intact. */
export function PropertyPhotoBranding({ enabled = false }: { enabled?: boolean }) {
  if (!enabled) return null

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/95 p-2 shadow-sm"
    >
      <Image
        src="/logo.svg"
        alt=""
        width={1425}
        height={341}
        className="h-auto w-24"
      />
    </span>
  )
}
