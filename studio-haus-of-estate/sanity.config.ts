import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'haus-of-estate-studio',
  title: 'Haus Of Estate Studio',
  projectId: 'jdxbkry4',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Posts')
              .child(
                S.documentList()
                  .title('All Posts')
                  .filter('_type == "post"')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
              ),
            S.divider(),
            S.listItem()
              .title('Authors')
              .child(S.documentList().title('Authors').filter('_type == "author"')),
            S.listItem()
              .title('Categories')
              .child(S.documentList().title('Categories').filter('_type == "category"')),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})