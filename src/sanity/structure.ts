import type { StructureBuilder, StructureResolver } from 'sanity/structure'
import { EDITORIAL_STATUS_OPTIONS } from './editorial-workflow'

type WorkflowDefinition = {
  type: string
  title: string
  statusField: string
  statuses: ReadonlyArray<{ title: string; value: string }>
  orderingField?: string
}

function workflowDesk(S: StructureBuilder, definition: WorkflowDefinition) {
  const orderingField = definition.orderingField ?? '_updatedAt'

  return S.listItem()
    .title(definition.title)
    .child(
      S.list()
        .title(definition.title)
        .items([
          ...definition.statuses.map(({ title, value }) =>
            S.listItem()
              .title(title)
              .child(
                S.documentList()
                  .title(`${title} ${definition.title.toLowerCase()}`)
                  .schemaType(definition.type)
                  .filter(`_type == $type && ${definition.statusField} == $status`)
                  .params({ type: definition.type, status: value })
                  .defaultOrdering([{ field: orderingField, direction: 'desc' }]),
              ),
          ),
          S.divider(),
          S.listItem()
            .title(`All ${definition.title}`)
            .child(
              S.documentList()
                .title(`All ${definition.title}`)
                .schemaType(definition.type)
                .filter('_type == $type')
                .params({ type: definition.type })
                .defaultOrdering([{ field: orderingField, direction: 'desc' }]),
            ),
        ]),
    )
}

function simpleDesk(
  S: StructureBuilder,
  title: string,
  type: string,
  ordering: { field: string; direction: 'asc' | 'desc' },
) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType(type)
        .filter('_type == $type')
        .params({ type })
        .defaultOrdering([ordering]),
    )
}

export function createStudioStructure({
  socialCampaignsEnabled,
}: {
  socialCampaignsEnabled: boolean
}): StructureResolver {
  return (S) =>
    S.list()
      .title('Haus content')
      .items([
        workflowDesk(S, {
          type: 'post',
          title: 'Articles',
          statusField: 'status',
          statuses: EDITORIAL_STATUS_OPTIONS,
          orderingField: 'publishedAt',
        }),
        workflowDesk(S, {
          type: 'property',
          title: 'Properties',
          statusField: 'status',
          statuses: EDITORIAL_STATUS_OPTIONS,
          orderingField: 'publishedAt',
        }),
        ...(socialCampaignsEnabled
          ? [
              S.divider(),
              workflowDesk(S, {
                type: 'socialCampaign',
                title: 'Social campaigns',
                statusField: 'workflowStatus',
                statuses: EDITORIAL_STATUS_OPTIONS,
              }),
            ]
          : []),
        S.divider(),
        simpleDesk(S, 'Roles', 'role', { field: 'publishedAt', direction: 'desc' }),
        simpleDesk(S, 'Team members', 'teamMember', { field: 'order', direction: 'asc' }),
        simpleDesk(S, 'Testimonials', 'testimonial', { field: 'order', direction: 'asc' }),
        simpleDesk(S, 'FAQs', 'faq', { field: 'order', direction: 'asc' }),
        simpleDesk(S, 'Culture moments', 'cultureMoment', { field: 'order', direction: 'asc' }),
        S.divider(),
        simpleDesk(S, 'Authors', 'author', { field: 'name', direction: 'asc' }),
        simpleDesk(S, 'Categories', 'category', { field: 'title', direction: 'asc' }),
      ])
}
