import { defineType, defineField, defineArrayMember } from 'sanity'
import { CaseIcon } from '@sanity/icons'

export const role = defineType({
  name: 'role',
  title: 'Role',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Public job title, e.g. "Property Advisor — London".',
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
      name: 'department',
      title: 'Department',
      type: 'string',
      description: 'Used to group roles on /careers.',
      options: {
        list: [
          { title: 'Advisory', value: 'Advisory' },
          { title: 'Lettings', value: 'Lettings' },
          { title: 'Operations', value: 'Operations' },
          { title: 'Marketing', value: 'Marketing' },
          { title: 'Technology', value: 'Technology' },
          { title: 'Finance', value: 'Finance' },
        ],
      },
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'City or "Remote". Free text.',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'employmentType',
      title: 'Employment Type',
      type: 'string',
      options: {
        list: [
          { title: 'Full-time', value: 'Full-time' },
          { title: 'Part-time', value: 'Part-time' },
          { title: 'Contract', value: 'Contract' },
          { title: 'Internship', value: 'Internship' },
        ],
        layout: 'radio',
      },
      initialValue: 'Full-time',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'One-paragraph hook shown on the careers index card.',
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      description: 'Full role description. Rich text.',
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
      name: 'responsibilities',
      title: 'Responsibilities',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'requirements',
      title: 'Requirements',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'niceToHave',
      title: 'Nice to have',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'applyEmail',
      title: 'Apply email',
      type: 'string',
      description: 'Mailbox to send applications to.',
      initialValue: 'info@hausofestate.com',
      validation: (rule) => rule.required().email(),
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
          { title: 'Open', value: 'open' },
          { title: 'Closed', value: 'closed' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Pin near the top of /careers.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'location',
      department: 'department',
      status: 'status',
    },
    prepare({ title, subtitle, department, status }) {
      const parts = [subtitle, department].filter(Boolean).join(' · ')
      return {
        title,
        subtitle: `${parts}${status ? ` — ${status}` : ''}`,
      }
    },
  },
})
