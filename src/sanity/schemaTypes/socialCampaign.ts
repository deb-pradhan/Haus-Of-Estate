import { defineArrayMember, defineField, defineType } from 'sanity'
import DocumentTextIcon from '@sanity/icons/DocumentText'
import {
  getSocialCampaignApprovalIssues,
  isSocialCampaignContentPath,
  isValidSocialCampaignKey,
  SOCIAL_PLATFORMS,
} from '../../lib/social-campaign'
import { TrackedSocialUrlInput } from '../components/tracked-social-url-input'

const SOCIAL_SOURCE_QUERY = `
  *[_id == $id && status == "published"][0] {
    _type,
    "slug": slug.current
  }
`

async function validateCanonicalCampaignSource(
  document: Record<string, unknown> | undefined,
  context: {
    getClient: (options: { apiVersion: string }) => {
      fetch: <T>(query: string, params: Record<string, string>) => Promise<T>
    }
  },
) {
  const workflowStatus = document?.workflowStatus
  if (workflowStatus !== 'approved' && workflowStatus !== 'published') return true

  const reference = document?.canonicalContent as { _ref?: unknown } | undefined
  if (typeof reference?._ref !== 'string' || reference._ref.startsWith('drafts.')) {
    return 'Approved campaigns must reference a published canonical document.'
  }

  const source = await context
    .getClient({ apiVersion: '2026-02-01' })
    .fetch<{ _type?: string; slug?: string } | null>(SOCIAL_SOURCE_QUERY, {
      id: reference._ref,
    })

  if (!source?.slug || !['post', 'property'].includes(source._type ?? '')) {
    return 'The canonical source must be a currently published property or article.'
  }

  const expectedPath =
    source._type === 'property'
      ? `/properties/${source.slug}`
      : `/blog/${source.slug}`

  return document?.canonicalPath === expectedPath
    ? true
    : `Canonical path must match the referenced content: ${expectedPath}`
}

const platformOptions = SOCIAL_PLATFORMS.map(({ title, value }) => ({
  title,
  value,
}))

export const socialCampaign = defineType({
  name: 'socialCampaign',
  title: 'Social Campaign',
  type: 'document',
  icon: DocumentTextIcon,
  description:
    'Human-approved publishing pack. This document does not publish to social platforms automatically.',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: 'canonicalContent',
      title: 'Canonical website content',
      type: 'reference',
      to: [{ type: 'property' }, { type: 'post' }],
      options: { disableNew: true, filter: 'status == "published"' },
      description: 'The published property or article this campaign promotes.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'canonicalPath',
      title: 'Canonical Haus path',
      type: 'string',
      description:
        'A public Haus path such as /properties/example or /blog/example. Do not add tracking parameters.',
      validation: (rule) =>
        rule.required().custom((value) =>
          isSocialCampaignContentPath(value)
            ? true
            : 'Use a /properties/... or /blog/... Haus path without a query, fragment or full domain.',
        ),
    }),
    defineField({
      name: 'utmCampaign',
      title: 'UTM campaign key',
      type: 'string',
      description:
        'Lowercase reporting key shared across platform links, for example dubai_launch.',
      validation: (rule) =>
        rule.required().custom((value) =>
          isValidSocialCampaignKey(value)
            ? true
            : 'Use lowercase letters and numbers separated by hyphens or underscores.',
        ),
    }),
    defineField({
      name: 'objective',
      title: 'Objective',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required().max(500),
    }),
    defineField({
      name: 'audience',
      title: 'Audience',
      type: 'text',
      rows: 2,
      description:
        'Describe the intended audience without protected traits or inferred personal characteristics.',
      validation: (rule) => rule.max(500),
    }),
    defineField({
      name: 'variants',
      title: 'Platform publishing pack',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'socialVariant',
          title: 'Platform variant',
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: { list: platformOptions },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'copy',
              title: 'Post copy',
              type: 'text',
              rows: 8,
              description:
                'Adapt the source for this platform and link back to the canonical Haus page.',
              validation: (rule) => rule.required().max(5000),
            }),
            defineField({
              name: 'firstComment',
              title: 'First comment (optional)',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.max(2000),
            }),
            defineField({
              name: 'asset',
              title: 'Platform asset',
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Alternative text',
                  type: 'string',
                  validation: (rule) => rule.required().max(300),
                }),
              ],
            }),
            defineField({
              name: 'scheduledFor',
              title: 'Suggested publication time',
              type: 'datetime',
            }),
            defineField({
              name: 'trackedUrlPreview',
              title: 'Tracked canonical link',
              type: 'string',
              readOnly: true,
              description:
                'Generated from the canonical Haus path, this platform and the campaign key.',
              components: { input: TrackedSocialUrlInput },
            }),
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'copy',
              media: 'asset',
            },
          },
        }),
      ],
      validation: (rule) =>
        rule.required().min(1).custom((variants) => {
          if (!Array.isArray(variants)) return true
          const platforms = variants
            .map((variant) =>
              typeof variant === 'object' && variant
                ? (variant as { platform?: unknown }).platform
                : undefined,
            )
            .filter((platform): platform is string => typeof platform === 'string')
          return new Set(platforms).size === platforms.length
            ? true
            : 'Add no more than one variant for each platform.'
        }),
    }),
    defineField({
      name: 'assetRights',
      title: 'Asset rights',
      type: 'object',
      fields: [
        defineField({
          name: 'confirmed',
          title: 'Haus has permission to use every asset',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'rightsHolder',
          title: 'Rights holder / source',
          type: 'string',
        }),
        defineField({
          name: 'usageNotes',
          title: 'Licence, credit or usage notes',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'confirmedBy',
          title: 'Confirmed by',
          type: 'string',
        }),
        defineField({
          name: 'confirmedAt',
          title: 'Confirmed at',
          type: 'datetime',
        }),
      ],
    }),
    defineField({
      name: 'approval',
      title: 'Human approval',
      type: 'object',
      description:
        'Both Marketing content approval and SEO/tracking approval are required before publishing.',
      fields: [
        defineField({
          name: 'contentApproved',
          title: 'Content and brand approved',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'trackingApproved',
          title: 'Links and tracking approved',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'approvedBy',
          title: 'Approved by',
          type: 'string',
        }),
        defineField({
          name: 'approvedAt',
          title: 'Approved at',
          type: 'datetime',
        }),
        defineField({
          name: 'notes',
          title: 'Approval notes',
          type: 'text',
          rows: 3,
        }),
      ],
    }),
    defineField({
      name: 'publishedUrls',
      title: 'Published platform URLs',
      type: 'array',
      description:
        'Add the live URL after a team member publishes each approved platform variant.',
      of: [
        defineArrayMember({
          name: 'publishedSocialUrl',
          title: 'Published URL',
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: { list: platformOptions },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'Live post URL',
              type: 'url',
              validation: (rule) =>
                rule.required().uri({ scheme: ['https'] }),
            }),
            defineField({
              name: 'publishedAt',
              title: 'Published at',
              type: 'datetime',
            }),
          ],
          preview: {
            select: { title: 'platform', subtitle: 'url' },
          },
        }),
      ],
    }),
    defineField({
      name: 'workflowStatus',
      title: 'Workflow status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'In review', value: 'in_review' },
          { title: 'Approved', value: 'approved' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (rule) =>
        rule.required().custom((status, context) => {
          if (status !== 'approved' && status !== 'published') return true
          const issues = getSocialCampaignApprovalIssues(context.document, {
            requirePublishedUrls: status === 'published',
          })
          return issues.length === 0
            ? true
            : `Complete the publishing pack first: ${issues.join(' ')}`
        }),
    }),
  ],
  validation: (rule) =>
    rule.custom((document, context) =>
      validateCanonicalCampaignSource(
        document as Record<string, unknown> | undefined,
        context,
      ),
    ),
  orderings: [
    {
      title: 'Recently updated',
      name: 'updatedDesc',
      by: [{ field: '_updatedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      status: 'workflowStatus',
      campaign: 'utmCampaign',
    },
    prepare({ title, status, campaign }) {
      return {
        title,
        subtitle: [status, campaign].filter(Boolean).join(' | '),
      }
    },
  },
})
