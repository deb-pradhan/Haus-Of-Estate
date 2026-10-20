import { defineType, defineField, defineArrayMember } from 'sanity'
import HomeIcon from '@sanity/icons/Home'
import { ALL_UNIT_TYPES } from '../../lib/property-taxonomy'

const propertyImageContext = [
  defineField({
    name: 'caption',
    title: 'Visible image caption',
    type: 'string',
    description: 'Displayed below the image. Clearly identify proposed interiors, AI-assisted concepts and comparison images; do not describe them as completed works.',
  }),
  defineField({
    name: 'mediaKind',
    title: 'Image context',
    type: 'string',
    description: 'Optional for existing photos. Mark concept images so the full image and a visible concept label are shown.',
    options: {
      list: [
        { title: 'Photograph', value: 'photo' },
        { title: 'Proposed interiors / AI-assisted concept', value: 'concept' },
        { title: 'Existing view and proposed interiors comparison', value: 'concept-comparison' },
      ],
    },
  }),
]

const designImage = defineArrayMember({
  type: 'image',
  options: { hotspot: false },
  fields: [
    defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'label', title: 'Caption', type: 'string' }),
  ],
})

export const property = defineType({
  name: 'property',
  title: 'Property',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Public listing title, e.g. "1-Bedroom Apartment — Al Furjan".',
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'community',
      title: 'Community / Development',
      type: 'string',
      description: 'e.g. "Al Furjan". Used to group listings.',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      initialValue: 'Dubai',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      initialValue: 'United Arab Emirates',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'developer',
      title: 'Developer',
      type: 'string',
      description: 'e.g. "Azizi Developments".',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Top-level taxonomy bucket used by nav, search and landing pages.',
      options: {
        list: [
          { title: 'Residential', value: 'residential' },
          { title: 'Commercial', value: 'commercial' },
        ],
        layout: 'radio',
      },
      initialValue: 'residential',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'array',
      description:
        'Whether the offering is ready-to-move and/or off-plan. A single showcase can be both.',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Ready', value: 'ready' },
          { title: 'Off-Plan', value: 'off-plan' },
        ],
        layout: 'grid',
      },
      initialValue: ['ready'],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'listingType',
      title: 'Listing type',
      type: 'array',
      description:
        'For sale and/or for rent. Off-plan properties can only be For sale.',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'For sale', value: 'sale' },
          { title: 'For rent', value: 'rent' },
        ],
        layout: 'grid',
      },
      initialValue: ['sale'],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .custom((value, context) => {
            const doc = context.document as { availability?: string[] } | undefined
            const availability = Array.isArray(doc?.availability)
              ? doc!.availability
              : []
            const offPlanOnly =
              availability.includes('off-plan') && !availability.includes('ready')
            if (
              offPlanOnly &&
              Array.isArray(value) &&
              value.includes('rent')
            ) {
              return 'Off-plan properties can only be For sale, not For rent.'
            }
            return true
          }),
    }),
    defineField({
      name: 'unitType',
      title: 'Unit Type',
      type: 'string',
      description:
        'Primary offering. For a development/community showcase, use the "Development" type. Home collections use their own type and Home designs array.',
      options: {
        list: ALL_UNIT_TYPES.map((value) => ({ title: value, value })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'unitNumber',
      title: 'Unit number (internal)',
      type: 'string',
      description:
        'Internal reference only — not shown on the public site. Leave blank for development/community showcases.',
    }),
    defineField({
      name: 'masterDevelopment',
      title: 'Master development',
      type: 'string',
      description:
        'Larger master-plan this property sits within, if any. e.g. "Azizi Venice" for Monaco Mansions.',
    }),
    defineField({
      name: 'view',
      title: 'View',
      type: 'string',
      options: {
        list: [
          { title: 'Lagoon', value: 'Lagoon' },
          { title: 'Sea', value: 'Sea' },
          { title: 'Park', value: 'Park' },
          { title: 'City', value: 'City' },
          { title: 'Garden', value: 'Garden' },
          { title: 'Skyline', value: 'Skyline' },
          { title: 'Pool', value: 'Pool' },
          { title: 'Other', value: 'Other' },
        ],
      },
    }),
    defineField({
      name: 'plotSizeDisplay',
      title: 'Plot size (display text)',
      type: 'string',
      description:
        'Land plot size, e.g. "10,000 – 20,000 sq ft". For mansions/villas with a plot distinct from BUA.',
    }),
    defineField({
      name: 'paymentPlan',
      title: 'Payment plan',
      type: 'string',
      description: 'e.g. "Standard", "60/40", "On handover".',
    }),
    defineField({
      name: 'bedrooms',
      title: 'Bedrooms',
      type: 'number',
      description: 'Use 0 for a studio. Leave blank for retail.',
      validation: (rule) => rule.min(0).max(20),
    }),
    defineField({
      name: 'bathrooms',
      title: 'Bathrooms',
      type: 'number',
      validation: (rule) => rule.min(0).max(20),
    }),
    defineField({
      name: 'sizeDisplay',
      title: 'Size (display text)',
      type: 'string',
      description:
        'Free text — e.g. "From 410 sq ft" or "On application". Not in the factsheet; fill when known.',
      initialValue: 'On application',
    }),
    defineField({
      name: 'priceDisplay',
      title: 'Sale price (display text)',
      type: 'string',
      description:
        'Free text — e.g. "From £140,000". Use the supplied source currency and preserve any cluster or collection scope.',
      initialValue: 'Price on application',
    }),
    defineField({
      name: 'priceAmount', title: 'Confirmed starting price', type: 'number',
      description: 'Optional source-currency starting amount for grouping collections. Keep the collection scope in the display text.',
      validation: (rule) => rule.positive(),
    }),
    defineField({
      name: 'priceCurrency', title: 'Source currency (ISO code)', type: 'string',
      validation: (rule) => rule.regex(/^[A-Z]{3}$/).custom((value, context) =>
        context.document?.priceAmount != null && !value ? 'A source currency is required with a numeric price.' : true),
    }),
    defineField({
      name: 'rentPriceDisplay',
      title: 'Rent price (display text)',
      type: 'string',
      description:
        'Free text shown when the listing is For rent — e.g. "From £2,500 / month". Leave blank for sale-only listings.',
    }),
    defineField({
      name: 'completionStatus',
      title: 'Completion Status',
      type: 'string',
      options: {
        list: [
          { title: 'Completed', value: 'completed' },
          { title: 'Off-plan', value: 'off-plan' },
          { title: 'Completed & off-plan', value: 'completed-offplan' },
        ],
        layout: 'radio',
      },
      initialValue: 'completed-offplan',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'One-paragraph hook shown on the listings card.',
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      description: 'Full listing description. Rich text.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'keyFeatures',
      title: 'Key Features',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'amenities',
      title: 'Community Amenities',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'locationBenefits',
      title: 'Location Benefits',
      type: 'array',
      description: 'Travel times to key destinations.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'locationBenefit',
          fields: [
            defineField({ name: 'destination', title: 'Destination', type: 'string' }),
            defineField({ name: 'time', title: 'Time', type: 'string' }),
          ],
          preview: {
            select: { title: 'destination', subtitle: 'time' },
          },
        }),
      ],
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        ...propertyImageContext,
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) =>
            rule.required().error('Alt text is required for accessibility'),
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [defineArrayMember({
        type: 'image',
        options: { hotspot: true },
        fields: [
          ...propertyImageContext,
          defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
        ],
      })],
    }),
    defineField({
      name: 'floorPlans',
      title: 'Property floor plans',
      type: 'array',
      description: 'Supplied plans for this property, separate from gallery images. Preserve the full plan, measurements and disclaimer.',
      of: [defineArrayMember({
        type: 'image',
        options: { hotspot: false },
        fields: [
          defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (rule) => rule.required() }),
          defineField({ name: 'caption', title: 'Caption / measurement disclaimer', type: 'string' }),
          defineField({ name: 'mediaKind', title: 'Image context', type: 'string', initialValue: 'floor-plan', options: { list: [{ title: 'Floor plan', value: 'floor-plan' }] } }),
        ],
      })],
    }),
    defineField({
      name: 'designVariants',
      title: 'Home designs',
      type: 'array',
      description: 'Optional brochure designs within this collection. Preserve source labels; these are not individual available units or selectable combinations.',
      of: [defineArrayMember({
        name: 'propertyDesign',
        title: 'Home design',
        type: 'object',
        fields: [
          defineField({ name: 'label', title: 'Source design label', type: 'string', validation: (rule) => rule.required() }),
          defineField({ name: 'family', title: 'Named family', type: 'string', description: 'Use only a family explicitly identified by the supplied source.' }),
          defineField({ name: 'rowHomes', title: 'Homes in the row', type: 'number', description: 'Connected homes in the row, not bedrooms.', validation: (rule) => rule.integer().min(2) }),
          defineField({
            name: 'position', title: 'Position', type: 'string',
            options: { list: [{ title: 'Corner', value: 'corner' }, { title: 'Middle', value: 'middle' }, { title: 'Standalone', value: 'standalone' }] },
          }),
          defineField({
            name: 'plotAreaStatus', title: 'Plot area evidence', type: 'string', initialValue: 'brochure',
            options: { list: [{ title: 'Brochure figure', value: 'brochure' }, { title: 'Conflicting source figures — hide plot area', value: 'conflict' }] },
            description: 'Conflicting plot figures are omitted from public data. Check plan artwork separately; do not upload conflicting summary diagrams.',
          }),
          defineField({ name: 'plotAreaSqFt', title: 'Plot area (sq ft)', type: 'number', validation: (rule) => rule.positive() }),
          defineField({ name: 'sellableAreaSqFt', title: 'Built-up area (sq ft)', type: 'number', description: 'For Florence, Sonia confirmed on 7 October 2026 that the brochure sellable-area figures should be labelled built-up area. Preserve the source figure; confirm the measurement definition for other projects.', validation: (rule) => rule.required().positive() }),
          defineField({ name: 'areaNote', title: 'Area review note (internal)', type: 'text', rows: 2, description: 'Retained for editorial review; not included in the public projection.' }),
          defineField({ name: 'summary', title: 'Design summary', type: 'text', rows: 3 }),
          defineField({ name: 'brochureKey', title: 'Collection brochure key', type: 'string', description: 'Internal collection identity for future approved fulfilment. This is not a public download URL.' }),
          defineField({ name: 'images', title: 'Matched design images', type: 'array', of: [designImage] }),
          defineField({ name: 'floorPlans', title: 'Matched floor plans', type: 'array', description: 'Upload uncropped plan images. Plans are shown publicly and can be opened to zoom.', of: [designImage] }),
          defineField({ name: 'brochureRevision', title: 'Brochure revision', type: 'string', description: 'Internal source reference; not shown on the website.' }),
          defineField({ name: 'sourceEvidence', title: 'Source evidence', type: 'text', rows: 3, description: 'Internal source filename/page references and unresolved mappings; not shown on the website.' }),
        ],
        preview: { select: { title: 'label', subtitle: 'family', media: 'images.0' } },
      })],
    }),
    defineField({
      name: 'interiorSchemes',
      title: 'Interior schemes shown in the brochure',
      type: 'array',
      description: 'Separate reference imagery. This does not establish selectable finishes, applicable homes, upgrades or included furniture.',
      of: [defineArrayMember({
        name: 'propertyInteriorScheme',
        title: 'Interior scheme',
        type: 'object',
        fields: [
          defineField({ name: 'label', title: 'Source scheme label', type: 'string', validation: (rule) => rule.required() }),
          defineField({ name: 'images', title: 'Scheme images', type: 'array', of: [designImage] }),
        ],
        preview: { select: { title: 'label', media: 'images.0' } },
      })],
    }),
    defineField({
      name: 'videoUrl',
      title: 'Walkthrough video URL',
      type: 'url',
      description:
        'YouTube or Vimeo URL. Renders as an embedded player on the listing.',
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https'] }).custom((url?: string) => {
          if (!url) return true
          const ok = /youtube\.com|youtu\.be|vimeo\.com/i.test(url)
          return ok || 'Use a YouTube or Vimeo URL.'
        }),
    }),
    defineField({
      name: 'enquiryEmail',
      title: 'Enquiry email',
      type: 'string',
      description: 'Mailbox enquiries route to.',
      initialValue: 'info@hausofestate.com',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show in the homepage showcase.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      community: 'community',
      city: 'city',
      status: 'status',
      media: 'featuredImage',
    },
    prepare({ title, community, city, status, media }) {
      const loc = [community, city].filter(Boolean).join(', ')
      return {
        title,
        subtitle: `${loc}${status ? ` — ${status}` : ''}`,
        media,
      }
    },
  },
})
