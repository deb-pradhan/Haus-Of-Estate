import type { DocumentActionComponent } from 'sanity'

import { isEditorialReadyForNativePublish } from './editorial-workflow'

export function guardEditorialPublishAction(
  OriginalPublishAction: DocumentActionComponent,
): DocumentActionComponent {
  const GuardedPublishAction: DocumentActionComponent = (props) => {
    const original = OriginalPublishAction(props)
    if (!original) return null

    const document = props.draft ?? props.published
    const workflowReady = isEditorialReadyForNativePublish(document)

    return {
      ...original,
      disabled: Boolean(original.disabled) || !workflowReady,
      title: workflowReady
        ? original.title
        : 'Set the website publication state to Published and complete both approvals before publishing.',
    }
  }

  GuardedPublishAction.action = OriginalPublishAction.action
  GuardedPublishAction.displayName = 'GuardedEditorialPublishAction'
  return GuardedPublishAction
}
