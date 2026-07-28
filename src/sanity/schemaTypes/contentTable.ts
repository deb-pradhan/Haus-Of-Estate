import { defineType, defineField, defineArrayMember } from 'sanity'

/** A single row of a content table — an ordered list of cell strings. */
export const tableRow = defineType({
  name: 'tableRow',
  title: 'Table Row',
  type: 'object',
  fields: [
    defineField({
      name: 'cells',
      title: 'Cells',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  preview: {
    select: { cells: 'cells' },
    prepare({ cells }) {
      return { title: (cells || []).join('  |  ') || 'Empty row' }
    },
  },
})

/** A simple, responsive table for use inside a post body. */
export const contentTable = defineType({
  name: 'contentTable',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'hasHeader',
      title: 'First row is a header',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [defineArrayMember({ type: 'tableRow' })],
    }),
    defineField({
      name: 'caption',
      title: 'Caption (optional)',
      type: 'string',
    }),
  ],
  preview: {
    select: { rows: 'rows', caption: 'caption' },
    prepare({ rows, caption }) {
      const count = Array.isArray(rows) ? rows.length : 0
      return { title: caption || 'Table', subtitle: `${count} row${count === 1 ? '' : 's'}` }
    },
  },
})
