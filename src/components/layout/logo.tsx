/**
 * Logo system for Haus of Estate.
 *
 * SVG FILES (in /public):
 * - Frame 16-1.svg  → full lockup, green symbol + gold wordmark  (header, auth, light BG)
 * - Frame 16-2.svg  → full lockup, white on dark                (footer on dark olive)
 * - Frame 18.svg    → full lockup, light/neutral on dark        (dark section overlays)
 * - Frame 21.svg    → wide lockup, green+gold, landscape        (hero, wide layouts)
 * - Frame 22.svg    → widest lockup, green+gold                 (maximum brand moments)
 * - Vector-1.svg    → green monogram/symbol only                  (favicon, app icon, mobile)
 * - Vector-2.svg    → white monogram/symbol only                  (dark BG contexts)
 * - Vector.svg      → black monogram/symbol only                  (light BG, compact)
 *
 * DEPLOYMENT RULES (per Brand Identity System §2.3-2.4):
 *
 * ✓ Header              → Frame 16-1.svg  (primary combination mark, 140px wide)
 * ✓ Footer (dark BG)    → Frame 16-2.svg  (white reversed on #445c43 deep olive)
 * ✓ Auth screen          → Frame 16-1.svg  (centered brand anchor, 160px wide)
 * ✓ Hero section        → Frame 22.svg    (maximum impact, wide landscape)
 * ✓ Mobile bottom nav   → Vector-1.svg    (symbol only, 28px, contextual)
 * ✓ Favicon / apple touch icon → Vector-1.svg  (monogram at tiny sizes)
 * ✓ Dark hero/CTA BG   → Frame 16-2.svg  or Vector-2.svg (white symbol)
 */

"use client";

import Image from "next/image";
import Link from "next/link";

// ─── Inline SVG monogram paths ────────────────────────────────────────────────
// All paths from Vector-1.svg (the green monogram)
const MONOGRAM_PATHS_GREEN = [
  "M207.773 0H230.521V341H207.773V0Z",
  "M178.957 0H209.289V15.1556H178.957V0Z",
  "M207.773 24.2489C207.773 19.2269 203.698 15.1557 198.673 15.1556H207.773V24.2489Z",
  "M192.607 336.453C200.982 336.453 207.772 329.668 207.773 321.298V336.453H192.607Z",
  "M230.521 321.298C230.521 329.668 237.312 336.453 245.687 336.453H230.521V321.298Z",
  "M178.957 336.453H207.773V341H178.957V336.453Z",
  "M227.488 336.453H256.303V341H227.488V336.453Z",
  "M230.521 0H320V16.6711H230.521V0Z",
  "M303.318 16.6711H320V125.791L303.318 134.127V16.6711Z",
  "M303.318 280.378H320V173.37L303.318 165.196V280.378Z",
  "M230.521 280.378H320V300.08H230.521V280.378Z",
  "M262.37 84.8711H279.052V219.756H262.37V84.8711Z",
  "M230.521 125.791H251.754V134.884H230.521V125.791Z",
  "M230.521 174.289H251.754V183.382H230.521V174.289Z",
  "M263.02 113.667L266.237 116.882L251.938 131.171L248.72 127.956L263.02 113.667Z",
  "M263.02 162.164L266.237 165.379L251.938 179.669L248.72 176.454L263.02 162.164Z",
  "M265.8 142.724L262.577 145.932L248.72 132.031L251.944 128.822L265.8 142.724Z",
  "M265.8 191.222L262.577 194.43L248.72 180.529L251.944 177.32L265.8 191.222Z",
  "M178.957 280.378H207.773V300.08H178.957V280.378Z",
  "M118.294 125.791H207.773V137.916H118.294V125.791Z",
  "M118.294 174.289H207.773V183.382H118.294V174.289Z",
  "M113.915 0H90.8242V341H113.915V0Z",
  "M143.164 0H112.376V15.1556H143.164V0Z",
  "M113.915 24.2489C113.915 19.2269 118.051 15.1557 123.151 15.1556H113.915V24.2489Z",
  "M129.309 336.453C120.807 336.453 113.915 329.668 113.915 321.298V336.453H129.309Z",
  "M90.8242 321.298C90.8242 329.668 83.9319 336.453 75.4303 336.453H90.8242V321.298Z",
  "M143.164 336.453H113.915V341H143.164V336.453Z",
  "M93.903 336.453H64.6545V341H93.903V336.453Z",
  "M90.8242 0H0V16.6711H90.8242V0Z",
  "M16.9333 16.6711H0V125.791L16.9333 134.127V16.6711Z",
  "M16.9333 280.378H0V173.37L16.9333 165.196L16.9333 280.378Z",
  "M90.8242 280.378H0V300.08H90.8242V280.378Z",
  "M58.497 84.8711H41.5636V219.756H58.497V84.8711Z",
  "M90.8242 125.791H69.2727V134.884H90.8242V125.791Z",
  "M90.8242 174.289H69.2727V183.382H90.8242V174.289Z",
  "M57.8374 113.667L54.5718 116.882L69.0859 131.171L72.3515 127.956L57.8374 113.667Z",
  "M57.8374 162.164L54.5718 165.379L69.0859 179.669L72.3515 176.454L57.8374 162.164Z",
  "M55.0147 142.724L58.2867 145.932L72.3514 132.031L69.0794 128.822L55.0147 142.724Z",
  "M55.0147 191.222L58.2867 194.43L72.3514 180.529L69.0794 177.32L55.0147 191.222Z",
  "M143.164 280.378H113.915V300.08H143.164V280.378Z",
  "M204.739 125.791H113.915V137.916H204.739V125.791Z",
  "M204.739 174.289H113.915V183.382H204.739V174.289Z",
];

// ─── Components ─────────────────────────────────────────────────────────────

/**
 * Inline SVG monogram — used for:
 * - Mobile bottom nav (compact, single-color)
 * - Favicon contexts where <img> isn't practical
 * - Dense UI where a full lockup is too wide
 */
export function LogoSymbol({
  color = "#456F57",
  className,
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 341"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {MONOGRAM_PATHS_GREEN.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </svg>
  );
}

/**
 * Full combination lockup for the header.
 * Uses Frame 16-1.svg — green architectural symbol + gold serif wordmark.
 * Minimum 140px wide per brand guidelines.
 */
export function LogoHeader({ className }: { className?: string }) {
  return (
    <Image
      src="/Frame 16-1.svg"
      alt="Haus of Estate"
      width={140}
      height={75}
      className={className}
      priority
    />
  );
}

/**
 * Reversed white logo for dark backgrounds.
 * Uses Frame 16-2.svg (already white-on-dark).
 */
export function LogoReversed({ className }: { className?: string }) {
  return (
    <Image
      src="/Frame 16-2.svg"
      alt="Haus of Estate"
      width={140}
      height={75}
      className={className}
    />
  );
}

/**
 * Wide logo for hero and maximum brand impact sections.
 * Uses Frame 22.svg — the widest landscape format.
 */
export function LogoHero({ className }: { className?: string }) {
  return (
    <Image
      src="/Frame 22.svg"
      alt="Haus of Estate"
      width={300}
      height={72}
      className={className}
      priority
    />
  );
}

/**
 * Compact monogram favicon as inline SVG.
 * Uses the green Vector-1.svg paths at tiny scale.
 */
export function LogoFavicon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Scaled-down monogram paths */}
      <path d="M20.777 0H23.052V34H20.777V0Z" fill="#456F57" />
      <path d="M17.896 0H20.929V1.515H17.896V0Z" fill="#456F57" />
      <path d="M20.777 2.425C20.777 1.923 20.370 1.515 19.867 1.515H20.777V2.425Z" fill="#456F57" />
      <path d="M19.261 33.645C20.098 33.645 20.777 32.967 20.777 32.130V33.645H19.261Z" fill="#456F57" />
      <path d="M23.052 32.130C23.052 32.967 23.731 33.645 24.569 33.645H23.052V32.130Z" fill="#456F57" />
      <path d="M17.896 33.645H20.777V34H17.896V33.645Z" fill="#456F57" />
      <path d="M22.749 33.645H25.630V34H22.749V33.645Z" fill="#456F57" />
      <path d="M23.052 0H32V1.667H23.052V0Z" fill="#456F57" />
      <path d="M30.332 1.667H32V12.579L30.332 13.413V1.667Z" fill="#456F57" />
      <path d="M30.332 28.038H32V17.337L30.332 16.520V28.038Z" fill="#456F57" />
      <path d="M23.052 28.038H32V30.008H23.052V28.038Z" fill="#456F57" />
      <path d="M26.237 8.487H27.905V21.976H26.237V8.487Z" fill="#456F57" />
      <path d="M23.052 12.579H25.175V13.481H23.052V12.579Z" fill="#456F57" />
      <path d="M23.052 17.429H25.175V18.338H23.052V17.429Z" fill="#456F57" />
      <path d="M26.302 11.367L26.624 11.688L25.194 13.117L24.872 12.796L26.302 11.367Z" fill="#456F57" />
      <path d="M26.302 16.216L26.624 16.538L25.194 17.967L24.872 17.645L26.302 16.216Z" fill="#456F57" />
      <path d="M26.580 14.272L26.258 14.593L24.872 13.203L25.194 12.882L26.580 14.272Z" fill="#456F57" />
      <path d="M26.580 19.122L26.258 19.443L24.872 18.053L25.194 17.732L26.580 19.122Z" fill="#456F57" />
      <path d="M17.896 28.038H20.777V30.008H17.896V28.038Z" fill="#456F57" />
      <path d="M11.829 12.579H20.777V13.792H11.829V12.579Z" fill="#456F57" />
      <path d="M11.829 17.429H20.777V18.338H11.829V17.429Z" fill="#456F57" />
      <path d="M11.392 0H9.082V34H11.392V0Z" fill="#456F57" />
      <path d="M14.316 0H11.238V1.515H14.316V0Z" fill="#456F57" />
      <path d="M11.392 2.425C11.392 1.923 11.805 1.515 12.315 1.515H11.392V2.425Z" fill="#456F57" />
      <path d="M12.931 33.645C12.081 33.645 11.392 32.967 11.392 32.130V33.645H12.931Z" fill="#456F57" />
      <path d="M9.082 32.130C9.082 32.967 8.393 33.645 7.543 33.645H9.082V32.130Z" fill="#456F57" />
      <path d="M14.316 33.645H11.392V34H14.316V33.645Z" fill="#456F57" />
      <path d="M9.390 33.645H6.465V34H9.390V33.645Z" fill="#456F57" />
      <path d="M9.082 0H0V1.667H9.082V0Z" fill="#456F57" />
      <path d="M1.693 1.667H0V12.579L1.693 13.413V1.667Z" fill="#456F57" />
      <path d="M1.693 28.038H0V17.337L1.693 16.520V28.038Z" fill="#456F57" />
      <path d="M9.082 28.038H0V30.008H9.082V28.038Z" fill="#456F57" />
      <path d="M5.850 8.487H4.156V21.976H5.850V8.487Z" fill="#456F57" />
      <path d="M9.082 12.579H6.927V13.481H9.082V12.579Z" fill="#456F57" />
      <path d="M9.082 17.429H6.927V18.338H9.082V17.429Z" fill="#456F57" />
      <path d="M5.784 11.367L5.457 11.688L6.927 13.117L7.253 12.796L5.784 11.367Z" fill="#456F57" />
      <path d="M5.784 16.216L5.457 16.538L6.927 17.967L7.253 17.645L5.784 16.216Z" fill="#456F57" />
      <path d="M5.561 14.272L5.892 14.593L7.253 13.203L6.922 12.882L5.561 14.272Z" fill="#456F57" />
      <path d="M5.561 19.122L5.892 19.443L7.253 18.053L6.922 17.732L5.561 19.122Z" fill="#456F57" />
      <path d="M14.316 28.038H11.392V30.008H14.316V28.038Z" fill="#456F57" />
      <path d="M15.874 12.579H11.392V13.792H15.874V12.579Z" fill="#456F57" />
      <path d="M15.874 17.429H11.392V18.338H15.874V17.429Z" fill="#456F57" />
    </svg>
  );
}
