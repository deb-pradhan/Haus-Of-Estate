import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './src/sanity/schemaTypes'

export default defineConfig({
  name: 'haus-of-estate-studio',
  title: 'Haus Of Estate Studio',
  basePath: '/studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'jdxbkry4',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
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
  ],
  schema: {
    types: schemaTypes,
  },
})