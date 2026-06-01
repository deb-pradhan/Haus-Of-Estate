import { defineType, defineField, defineArrayMember } from 'sanity'
import { HomeIcon } from '@sanity/icons'

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
      name: 'unitType',
      title: 'Unit Type',
      type: 'string',
      options: {
        list: [
          { title: 'Studio', value: 'Studio' },
          { title: '1 Bedroom', value: '1 Bedroom' },
          { title: '2 Bedroom', value: '2 Bedroom' },
          { title: '3 Bedroom', value: '3 Bedroom' },
          { title: 'Terrace Apartment', value: 'Terrace Apartment' },
          { title: 'Penthouse', value: 'Penthouse' },
          { title: 'Retail Unit', value: 'Retail Unit' },
        ],
      },
      validation: (rule) => rule.required(),
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
      title: 'Price (display text)',
      type: 'string',
      description:
        'Free text — e.g. "From £140,000" or "Price on application". The brand shows prices in GBP (£).',
      initialValue: 'Price on application',
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
