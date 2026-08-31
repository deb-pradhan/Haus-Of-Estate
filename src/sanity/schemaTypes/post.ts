import { defineType, defineField, defineArrayMember } from 'sanity'
import DocumentTextIcon from '@sanity/icons/DocumentText'
import {
  EDITORIAL_STATUS_OPTIONS,
  getEditorialApprovalIssues,
} from '../editorial-workflow'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Brief summary shown on cards',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
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
          validation: (rule) => rule.required().error('Alt text is required for accessibility'),
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
              { title: 'Underline', value: 'underline' },
            ],
            annotations: [
              {
                title: 'Link',
                name: 'link',
                type: 'object',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    validation: (rule) =>
                      rule.uri({ scheme: ['http', 'https', 'mailto'] }),
                  }),
                  defineField({
                    name: 'blank',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: false,
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({ type: 'image', options: { hotspot: true } }),
        defineArrayMember({ type: 'contentTable' }),
      ],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'category' }],
        }),
      ],
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
          title: 'Content, facts and asset rights approved',
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
      description: 'Show as featured post on blog index',
      initialValue: false,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
        defineField({ name: 'seoDesc', title: 'SEO Description', type: 'text', rows: 3 }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'featuredImage',
    },
  },
})
