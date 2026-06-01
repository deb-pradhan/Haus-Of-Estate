import { defineType, defineField } from 'sanity'
import { CommentIcon } from '@sanity/icons'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'authorName',
      title: 'Author name',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'authorLocation',
      title: 'Author location',
      type: 'string',
      description: 'e.g. "Cardiff, UK" or "Dubai".',
    }),
    defineField({
      name: 'authorPhoto',
      title: 'Author photo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'rating',
      title: 'Star rating',
      type: 'number',
      validation: (rule) => rule.required().min(1).max(5),
      initialValue: 5,
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().max(800),
    }),
    defineField({
      name: 'tag',
      title: 'Tag',
      type: 'string',
      description: 'Short pill tag e.g. "#FastClosing", "#GlobalExpertise".',
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          { title: 'Verified — internal', value: 'verified' },
          { title: 'Google Reviews', value: 'google' },
          { title: 'Trustpilot', value: 'trustpilot' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      initialValue: 'verified',
    }),
    defineField({
      name: 'datePublished',
      title: 'Date published',
      type: 'date',
    }),
    defineField({
      name: 'featured',
      title: 'Featured (homepage)',
      type: 'boolean',
      description: 'Pin in the homepage reviews section.',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      initialValue: 100,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
        ],
        layout: 'radio',
      },
      initialValue: 'published',
    }),
  ],
  preview: {
    select: { title: 'authorName', subtitle: 'quote', media: 'authorPhoto' },
  },
})
