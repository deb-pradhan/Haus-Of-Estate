import { defineConfig, type Template } from 'sanity'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
import {
  sanityProjectId,
  sanityStudioBasePath,
  sanityStudioDataset,
  siteOrigin,
  socialCampaignsEnabled,
} from './src/sanity/config'
import { presentationResolve } from './src/sanity/presentation'
import { schemaTypes } from './src/sanity/schemaTypes'
import { createStudioStructure } from './src/sanity/structure'
import { guardEditorialPublishAction } from './src/sanity/workflow-actions'

const guardedEditorialTypes = new Set(['post', 'property'])

export default defineConfig({
  name: 'haus-of-estate-studio',
  title: 'Haus Of Estate Studio',
  basePath: sanityStudioBasePath,
  projectId: sanityProjectId,
  dataset: sanityStudioDataset,
  plugins: [
    structureTool({
      structure: createStudioStructure({ socialCampaignsEnabled }),
    }),
    presentationTool({
      resolve: presentationResolve,
      previewUrl: {
        initial: siteOrigin,
        previewMode: {
          enable: '/api/draft-mode/enable',
          shareAccess: false,
        },
      },
      allowOrigins: [siteOrigin],
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  templates: (templates: Template[]) =>
    socialCampaignsEnabled
      ? templates
      : templates.filter(
          ({ schemaType }: Template) => schemaType !== 'socialCampaign',
        ),
  document: {
    newDocumentOptions: (options) =>
      socialCampaignsEnabled
        ? options
        : options.filter(({ templateId }) => templateId !== 'socialCampaign'),
    actions: (actions, context) => {
      if (!guardedEditorialTypes.has(context.schemaType)) return actions
      return actions.map((action) =>
        action.action === 'publish'
          ? guardEditorialPublishAction(action)
          : action,
      )
    },
  },
})
