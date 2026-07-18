// ─────────────────────────────────────────────────────────────────────────
// Property taxonomy — SINGLE source of truth.
//
// Imported by the Sanity schema options, the header mega-menu, the hero
// search, the listings filter, breadcrumbs and the landing routes. Keep this
// module framework-agnostic (no React / next imports) so it can be consumed
// from both server components and the Sanity Studio schema.
//
// Shape of a listing: Category → Availability → Intent → Type.
//   • Off-Plan is BUY-ONLY (never For rent).
//   • Building & Hotel are intentional cross-category types.
// ─────────────────────────────────────────────────────────────────────────

export type Category = 'residential' | 'commercial'
export type Availability = 'ready' | 'off-plan'
export type Intent = 'sale' | 'rent'

export const CATEGORIES: readonly Category[] = ['residential', 'commercial']
export const AVAILABILITIES: readonly Availability[] = ['ready', 'off-plan']
export const INTENTS: readonly Intent[] = ['sale', 'rent']

// ── Human labels ───────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<Category, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
}

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  ready: 'Ready',
  'off-plan': 'Off-Plan',
}

// Intent is expressed to buyers as "To buy" / "To rent".
export const INTENT_LABELS: Record<Intent, string> = {
  sale: 'To buy',
  rent: 'To rent',
}

// ── Type lists (canonical singular enum values) ──────────────────────────
// These are the values stored in `unitType` on the property document.

export const TYPES_BY_CATEGORY: Record<Category, readonly string[]> = {
  residential: [
    'Apartment',
    'Townhouse',
    'Villa',
    'Mansion',
    'Building',
    'Hotel',
    'Mixed Land Plot',
    'Residential Land Plot',
  ],
  commercial: [
    'Office',
    'Retail Unit',
    'Shopping Mall',
    'Building',
    'Hotel',
    'Commercial Plot',
    'Mixed-Use Plot',
  ],
}

export const OFFPLAN_TYPES_BY_CATEGORY: Record<Category, readonly string[]> = {
  residential: ['Apartment', 'Townhouse', 'Villa', 'Mansion', 'Building', 'Hotel'],
  commercial: [
    'Office',
    'Retail Unit',
    'Shopping Mall',
    'Building',
    'Hotel',
    'Commercial Land',
  ],
}

// Land / plot types — bedrooms are irrelevant for these (and for commercial).
export const LAND_TYPES: readonly string[] = [
  'Mixed Land Plot',
  'Residential Land Plot',
  'Commercial Plot',
  'Mixed-Use Plot',
  'Commercial Land',
]

// Legacy residential unit types kept available in the schema enum. Not shown
// in the browse-by-type nav (which uses the canonical generic types above),
// but still valid stored values on existing/older documents.
export const LEGACY_RESIDENTIAL_UNIT_TYPES: readonly string[] = [
  'Studio',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
  'Terrace Apartment',
  'Penthouse',
]

// Every distinct unitType value the schema should accept, de-duplicated and
// ordered residential-first. Consumed by the Sanity schema `list` option.
export const ALL_UNIT_TYPES: readonly string[] = Array.from(
  new Set<string>([
    ...TYPES_BY_CATEGORY.residential,
    ...LEGACY_RESIDENTIAL_UNIT_TYPES,
    ...TYPES_BY_CATEGORY.commercial,
    ...OFFPLAN_TYPES_BY_CATEGORY.commercial,
  ]),
)

// ── Type guards ──────────────────────────────────────────────────────────

export function isCategory(value: unknown): value is Category {
  return value === 'residential' || value === 'commercial'
}

export function isAvailability(value: unknown): value is Availability {
  return value === 'ready' || value === 'off-plan'
}

export function isIntent(value: unknown): value is Intent {
  return value === 'sale' || value === 'rent'
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Types offered for a given category + availability selection. */
export function typesFor(
  category: Category,
  availability?: Availability,
): readonly string[] {
  if (availability === 'off-plan') return OFFPLAN_TYPES_BY_CATEGORY[category]
  return TYPES_BY_CATEGORY[category]
}

/** True when bedrooms should be hidden (commercial category or a land plot). */
export function bedroomsHidden(category?: string, type?: string): boolean {
  if (category === 'commercial') return true
  if (type && LAND_TYPES.includes(type)) return true
  return false
}

// ── URL builder ──────────────────────────────────────────────────────────

export interface PropertyQuery {
  category?: Category | string
  availability?: Availability | string
  intent?: Intent | string
  type?: string
  location?: string
  beds?: string | number
}

/**
 * Build a canonical `/properties` href from a taxonomy selection.
 * Produces: /properties?category=&availability=&intent=&type=&location=&beds=
 * Off-Plan is buy-only, so intent is forced to `sale` whenever
 * availability is `off-plan`.
 */
export function buildPropertiesHref(query: PropertyQuery = {}): string {
  const params = new URLSearchParams()
  const offPlan = query.availability === 'off-plan'

  if (query.category) params.set('category', String(query.category))
  if (query.availability) params.set('availability', String(query.availability))

  const intent = offPlan ? 'sale' : query.intent
  if (intent) params.set('intent', String(intent))

  if (query.type) params.set('type', String(query.type))
  if (query.location) params.set('location', String(query.location))
  if (query.beds !== undefined && query.beds !== null && query.beds !== '') {
    params.set('beds', String(query.beds))
  }

  const qs = params.toString()
  return qs ? `/properties?${qs}` : '/properties'
}

// ── Mega-menu / mobile-nav tree ──────────────────────────────────────────
// Empty branches (all Commercial, all Rent) are flagged `muted` so the UI can
// render them greyed-out with a "Coming soon" tag. Their links still resolve
// to a real filtered URL (which lands on the lead-capture empty state) — never
// a dead end.

export interface MenuLink {
  label: string
  href: string
  muted: boolean
}

export interface MenuGroup {
  heading: string
  links: MenuLink[]
}

export interface MenuColumn {
  category: Category
  label: string
  viewAllLabel: string
  viewAllHref: string
  muted: boolean
  groups: MenuGroup[]
}

/** Build the Properties navigation tree from the taxonomy. */
export function buildPropertiesMenu(): MenuColumn[] {
  return CATEGORIES.map((category) => {
    const categoryMuted = category === 'commercial'

    const groups: MenuGroup[] = [
      {
        heading: AVAILABILITY_LABELS.ready,
        links: [
          {
            label: INTENT_LABELS.sale,
            href: buildPropertiesHref({ category, availability: 'ready', intent: 'sale' }),
            muted: categoryMuted,
          },
          {
            // Rent has no inventory anywhere yet — always muted.
            label: INTENT_LABELS.rent,
            href: buildPropertiesHref({ category, availability: 'ready', intent: 'rent' }),
            muted: true,
          },
        ],
      },
      {
        heading: AVAILABILITY_LABELS['off-plan'],
        links: [
          {
            label: INTENT_LABELS.sale,
            href: buildPropertiesHref({ category, availability: 'off-plan' }),
            muted: categoryMuted,
          },
        ],
      },
      {
        heading: 'Browse by type',
        links: TYPES_BY_CATEGORY[category].map((type) => ({
          label: type,
          href: buildPropertiesHref({ category, type }),
          muted: categoryMuted,
        })),
      },
    ]

    return {
      category,
      label: CATEGORY_LABELS[category],
      viewAllLabel: `View all ${CATEGORY_LABELS[category].toLowerCase()}`,
      viewAllHref: `/properties/${category}`,
      muted: categoryMuted,
      groups,
    }
  })
}

// ── Breadcrumb builder ────────────────────────────────────────────────────

export interface Crumb {
  label: string
  href: string
}

/**
 * Build the breadcrumb trail for an active filter selection, e.g.
 * Properties / Residential / Ready / To buy / Apartment.
 * Each crumb links to the progressively-widened URL.
 */
export function buildBreadcrumbs(selection: {
  category?: Category
  availability?: Availability
  intent?: Intent
  type?: string
}): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Properties', href: '/properties' }]
  const acc: PropertyQuery = {}

  if (selection.category) {
    acc.category = selection.category
    crumbs.push({
      label: CATEGORY_LABELS[selection.category],
      href: buildPropertiesHref(acc),
    })
  }
  if (selection.availability) {
    acc.availability = selection.availability
    crumbs.push({
      label: AVAILABILITY_LABELS[selection.availability],
      href: buildPropertiesHref(acc),
    })
  }
  // Off-plan is buy-only, so a distinct intent crumb only reads meaningfully
  // for ready listings; still include it when present for a complete trail.
  if (selection.intent) {
    acc.intent = selection.intent
    crumbs.push({
      label: INTENT_LABELS[selection.intent],
      href: buildPropertiesHref(acc),
    })
  }
  if (selection.type) {
    acc.type = selection.type
    crumbs.push({ label: selection.type, href: buildPropertiesHref(acc) })
  }

  return crumbs
}
