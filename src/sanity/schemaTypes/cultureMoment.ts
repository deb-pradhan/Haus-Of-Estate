import { defineType, defineField } from 'sanity'
import { ImagesIcon } from '@sanity/icons'

export const cultureMoment = defineType({
  name: 'cultureMoment',
  title: 'Culture Moment',
  type: 'document',
  icon: ImagesIcon,
  description: 'A behind-the-scenes photo for the Careers "Life at Haus of Estate" section.',
  fields: [
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Short caption shown under the photo.',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Team', value: 'Team' },
          { title: 'Office', value: 'Office' },
          { title: 'Training', value: 'Training' },
          { title: 'Celebration', value: 'Celebration' },
          { title: 'Event', value: 'Event' },
          { title: 'Other', value: 'Other' },
        ],
      },
      initialValue: 'Team',
    }),
    defineField({
      name: 'takenOn',
      title: 'Taken on',
      type: 'date',
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
    select: { title: 'caption', subtitle: 'category', media: 'photo' },
  },
})
