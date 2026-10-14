'use client'

import { useState } from 'react'
import type { StringInputProps } from 'sanity'
import { useFormValue } from 'sanity'

import {
  buildTrackedSocialUrl,
  isSocialPlatform,
} from '../../lib/social-campaign'

export function TrackedSocialUrlInput(props: StringInputProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const canonicalPath = useFormValue(['canonicalPath'])
  const campaign = useFormValue(['utmCampaign'])
  const platform = useFormValue([...props.path.slice(0, -1), 'platform'])

  let trackedUrl = ''
  if (
    typeof canonicalPath === 'string' &&
    typeof campaign === 'string' &&
    isSocialPlatform(platform)
  ) {
    try {
      trackedUrl = buildTrackedSocialUrl({
        canonicalPath,
        platform,
        campaign,
      })
    } catch {
      trackedUrl = ''
    }
  }

  async function copyTrackedUrl() {
    if (!trackedUrl) return
    try {
      await navigator.clipboard.writeText(trackedUrl)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--card-border-color)',
        borderRadius: 4,
        display: 'grid',
        gap: 8,
        padding: 12,
      }}
    >
      <output style={{ overflowWrap: 'anywhere', fontSize: 13 }}>
        {trackedUrl ||
          'Choose a platform and complete the canonical path and campaign key.'}
      </output>
      <button
        type="button"
        disabled={!trackedUrl}
        onClick={copyTrackedUrl}
        style={{ minHeight: 36, width: 'fit-content' }}
      >
        Copy tracked link
      </button>
      <span aria-live="polite" style={{ fontSize: 12 }}>
        {copyState === 'copied'
          ? 'Copied.'
          : copyState === 'failed'
            ? 'Copy failed. Select the URL and copy it manually.'
            : ''}
      </span>
    </div>
  )
}
