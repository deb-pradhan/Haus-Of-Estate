import { defineType, defineField, defineArrayMember } from 'sanity'
import HomeIcon from '@sanity/icons/Home'
import { ALL_UNIT_TYPES } from '../../lib/property-taxonomy'
import {
  EDITORIAL_STATUS_OPTIONS,
  getEditorialApprovalIssues,
} from '../editorial-workflow'

const currencyOptions = [
  { title: 'AED - UAE dirham', value: 'AED' },
  { title: 'GBP - British pound', value: 'GBP' },
  { title: 'EUR - Euro', value: 'EUR' },
  { title: 'USD - US dollar', value: 'USD' },
]

export const property = defineType({
  name: 'property',
  title: 'Property',
  type: 'document',
  icon: HomeIcon,
  fieldsets: [
    {
      name: 'structuredPricing',
      title: 'Structured pricing',
      description:
        'Machine-readable values for filtering and integrations. Keep the public display text until existing content is backfilled and reviewed.',
      options: { columns: 2, collapsible: true },
    },
    {
      name: 'availabilityGovernance',
      title: 'Availability and verification',
      description:
        'Internal checks only. Never claim a price, availability or escrow status that has not been confirmed.',
      options: { collapsible: true },
    },
  ],
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
        'Primary offering. For a development/community showcase, use the generic type (e.g. "Apartment" or "Mansion"); per-unit variants go in Key Features.',
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
        'Free text — e.g. "From £140,000" or "Price on application". The brand shows prices in GBP (£).',
      initialValue: 'Price on application',
    }),
    defineField({
      name: 'rentPriceDisplay',
      title: 'Rent price (display text)',
      type: 'string',
      description:
        'Free text shown when the listing is For rent — e.g. "From £2,500 / month". Leave blank for sale-only listings.',
    }),
    defineField({
      name: 'priceAmount',
      title: 'Sale price amount',
      type: 'number',
      fieldset: 'structuredPricing',
      description: 'Number only; do not include a currency symbol or separators.',
      validation: (rule) =>
        rule.positive().precision(2).custom((value, context) => {
          const document = context.document as
            | { status?: string; listingType?: string[] }
            | undefined
          return document?.status === 'published' &&
            document.listingType?.includes('sale') &&
            value == null
            ? 'Published sale listings should have a structured sale price, unless the price is genuinely on application.'
            : true
        }).warning(),
    }),
    defineField({
      name: 'priceCurrency',
      title: 'Sale price currency',
      type: 'string',
      fieldset: 'structuredPricing',
      options: { list: currencyOptions },
      validation: (rule) =>
        rule.custom((value, context) => {
          const document = context.document as { priceAmount?: number } | undefined
          return document?.priceAmount != null && !value
            ? 'Choose a currency whenever a sale price amount is entered.'
            : true
        }).warning(),
    }),
    defineField({
      name: 'rentAmount',
      title: 'Rent amount',
      type: 'number',
      fieldset: 'structuredPricing',
      description: 'Number only; do not include a currency symbol or separators.',
      validation: (rule) => rule.positive().precision(2),
    }),
    defineField({
      name: 'rentCurrency',
      title: 'Rent currency',
      type: 'string',
      fieldset: 'structuredPricing',
      options: { list: currencyOptions },
      validation: (rule) =>
        rule.custom((value, context) => {
          const document = context.document as { rentAmount?: number } | undefined
          return document?.rentAmount != null && !value
            ? 'Choose a currency whenever a rent amount is entered.'
            : true
        }).warning(),
    }),
    defineField({
      name: 'rentPeriod',
      title: 'Rent period',
      type: 'string',
      fieldset: 'structuredPricing',
      options: {
        list: [
          { title: 'Per week', value: 'week' },
          { title: 'Per month', value: 'month' },
          { title: 'Per year', value: 'year' },
        ],
      },
      validation: (rule) =>
        rule.custom((value, context) => {
          const document = context.document as { rentAmount?: number } | undefined
          return document?.rentAmount != null && !value
            ? 'Choose a period whenever a rent amount is entered.'
            : true
        }).warning(),
    }),
    defineField({
      name: 'listingState',
      title: 'Current listing state',
      type: 'string',
      fieldset: 'availabilityGovernance',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Reserved', value: 'reserved' },
          { title: 'Under offer', value: 'under_offer' },
          { title: 'Sold', value: 'sold' },
          { title: 'Rented', value: 'rented' },
          { title: 'Withdrawn', value: 'withdrawn' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
      validation: (rule) =>
        rule.custom((value, context) => {
          const document = context.document as { status?: string } | undefined
          return document?.status === 'published' && !value
            ? 'Published properties should have a current listing state.'
            : true
        }).warning(),
    }),
    defineField({
      name: 'availabilityCheckedAt',
      title: 'Availability last checked',
      type: 'datetime',
      fieldset: 'availabilityGovernance',
      validation: (rule) => rule.max(new Date().toISOString()),
    }),
    defineField({
      name: 'availabilityCheckDueAt',
      title: 'Availability check due',
      type: 'datetime',
      fieldset: 'availabilityGovernance',
      description: 'The listing should be re-confirmed on or before this date.',
    }),
    defineField({
      name: 'verification',
      title: 'Listing verification',
      type: 'object',
      fieldset: 'availabilityGovernance',
      fields: [
        defineField({
          name: 'status',
          title: 'Verification status',
          type: 'string',
          options: {
            list: [
              { title: 'Unverified', value: 'unverified' },
              { title: 'Verified', value: 'verified' },
              { title: 'Expired', value: 'expired' },
            ],
            layout: 'radio',
          },
          initialValue: 'unverified',
        }),
        defineField({
          name: 'checkedAt',
          title: 'Checked at',
          type: 'datetime',
        }),
        defineField({
          name: 'checkedBy',
          title: 'Checked by',
          type: 'string',
          validation: (rule) => rule.max(120),
        }),
        defineField({
          name: 'sourceUrl',
          title: 'Verification source',
          type: 'url',
          description: 'Internal evidence link; not exposed on the public website.',
          validation: (rule) => rule.uri({ scheme: ['https'] }),
        }),
        defineField({
          name: 'notes',
          title: 'Verification notes',
          type: 'text',
          rows: 3,
        }),
      ],
      validation: (rule) =>
        rule.custom((value, context) => {
          const document = context.document as { status?: string } | undefined
          const verification = value as { status?: string } | undefined
          return document?.status === 'published' && !verification?.status
            ? 'Published properties should have an explicit verification status.'
            : true
        }).warning(),
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
      of: [defineArrayMember({ type: 'image', options: { hotspot: true } })],
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
      name: 'editorialApproval',
      title: 'Editorial approval',
      type: 'object',
      description:
        'Required before the website publication state can be released with Sanity Publish.',
      fields: [
        defineField({
          name: 'contentApproved',
          title: 'Listing facts and asset rights approved',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'seoApproved',
          title: 'SEO, links and tracking approved',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'approvedBy',
          title: 'Approved by',
          type: 'string',
          validation: (rule) => rule.max(160),
        }),
        defineField({
          name: 'approvedAt',
          title: 'Approved at',
          type: 'datetime',
        }),
        defineField({
          name: 'notes',
          title: 'Review notes',
          type: 'text',
          rows: 3,
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Website publication state',
      type: 'string',
      description:
        'The public website only reads Published records. Complete review and approval before selecting Published, then use Sanity Publish to release the saved revision.',
      options: {
        list: [...EDITORIAL_STATUS_OPTIONS],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (rule) =>
        rule.required().custom((status, context) => {
          const issues = getEditorialApprovalIssues({
            ...context.document,
            status,
          })
          return issues.length === 0 ? true : issues.join(' ')
        }),
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
