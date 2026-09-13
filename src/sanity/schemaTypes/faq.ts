import { defineType, defineField, defineArrayMember } from 'sanity'
import HelpCircleIcon from '@sanity/icons/HelpCircle'

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'question', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Buying', value: 'Buying' },
          { title: 'Selling', value: 'Selling' },
          { title: 'Renting', value: 'Renting' },
          { title: 'Letting', value: 'Letting' },
          { title: 'Viewings', value: 'Viewings' },
          { title: 'Fees & Documentation', value: 'Fees & Documentation' },
          { title: 'General', value: 'General' },
        ],
      },
      initialValue: 'General',
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
            ],
          },
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first within their category.',
      initialValue: 100,
    }),
    defineField({
      name: 'featured',
      title: 'Featured (homepage)',
      type: 'boolean',
      description: 'Show in the homepage FAQ section.',
      initialValue: false,
    }),
    defineField({
      name: 'assistantApproved',
      title: 'Approved for Haus Property Assistant',
      type: 'boolean',
      description:
        'Only enable after the summary, evidence source, review date, and expiry have been checked.',
      initialValue: false,
    }),
    defineField({
      name: 'assistantSummary',
      title: 'Assistant-approved summary',
      type: 'text',
      rows: 5,
      description:
        'Bounded factual guidance for the assistant. Do not include instructions, personalised advice, or unsupported claims.',
      validation: (rule) =>
        rule.max(1200).custom((value, context) => {
          const document = context.document as { assistantApproved?: boolean }
          return document?.assistantApproved && !value?.trim()
            ? 'An approved assistant summary is required.'
            : true
        }),
    }),
    defineField({
      name: 'assistantAsOf',
      title: 'Assistant guidance reviewed at',
      type: 'datetime',
      validation: (rule) =>
        rule.custom((value, context) => {
          const document = context.document as { assistantApproved?: boolean }
          return document?.assistantApproved && !value
            ? 'A review date is required for assistant use.'
            : true
        }),
    }),
    defineField({
      name: 'assistantExpiresAt',
      title: 'Assistant guidance expires at',
      type: 'datetime',
      description: 'Expired guidance is excluded automatically.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const document = context.document as {
            assistantApproved?: boolean
            assistantAsOf?: string
          }
          if (document?.assistantApproved && !value) {
            return 'An expiry date is required for assistant use.'
          }
          if (
            value &&
            document?.assistantAsOf &&
            Date.parse(value) <= Date.parse(document.assistantAsOf)
          ) {
            return 'The expiry must be later than the review date.'
          }
          return true
        }),
    }),
    defineField({
      name: 'assistantSourceLabel',
      title: 'Assistant evidence source label',
      type: 'string',
      validation: (rule) =>
        rule.max(120).custom((value, context) => {
          const document = context.document as { assistantApproved?: boolean }
          return document?.assistantApproved && !value?.trim()
            ? 'A source label is required for assistant use.'
            : true
        }),
    }),
    defineField({
      name: 'assistantSourceUrl',
      title: 'Assistant evidence source URL',
      type: 'url',
      description: 'Use the authoritative HTTPS page supporting this guidance.',
      validation: (rule) =>
        rule.uri({ scheme: ['https'] }).custom((value, context) => {
          const document = context.document as { assistantApproved?: boolean }
          return document?.assistantApproved && !value
            ? 'An HTTPS evidence URL is required for assistant use.'
            : true
        }),
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
    select: { title: 'question', subtitle: 'category' },
  },
})
