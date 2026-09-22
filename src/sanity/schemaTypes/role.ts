import { defineType, defineField, defineArrayMember } from 'sanity'
import CaseIcon from '@sanity/icons/Case'

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
      description: 'Use the exact approved title from content/careers-roles.json.',
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
          { title: 'Lettings Agent', value: 'Lettings Agent' },
          { title: 'Sales Agent', value: 'Sales Agent' },
          { title: 'Career Experience Openings', value: 'Career Experience Openings' },
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
      description: 'Leave empty unless the arrangement has been confirmed for this role.',
      options: {
        list: [
          { title: 'Full-time', value: 'Full-time' },
          { title: 'Part-time', value: 'Part-time' },
          { title: 'Contract', value: 'Contract' },
          { title: 'Internship', value: 'Internship' },
          { title: 'Self Employed', value: 'Self Employed' },
        ],
        layout: 'radio',
      },
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
      description: 'Retained for history. The website contact and application destination are both set by CAREERS_EMAIL (HR mailbox by default).',
      readOnly: true,
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
      description: 'Public vacancies are limited to the approved 22 September reopening list in content/careers-roles.json. Website application intake is enabled separately. Close retired records; do not delete their history.',
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
