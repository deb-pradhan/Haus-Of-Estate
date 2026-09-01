import { defineCliConfig } from 'sanity/cli'

import { sanityProjectId, sanityStudioDataset } from './src/sanity/config'

export default defineCliConfig({
  api: {
    projectId: sanityProjectId,
    dataset: sanityStudioDataset,
  },
})
