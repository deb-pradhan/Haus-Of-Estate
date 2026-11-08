import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { findLaunchInterest } from '@/lib/launches/registry'

vi.mock('@/components/lead-eoi/lead-eoi-form', () => ({
  LeadEoiForm: (props: { surface: string; launchInterest?: { key: string } }) => (
    <form data-surface={props.surface} data-launch={props.launchInterest?.key} />
  ),
}))

const { LaunchInterestCta, LaunchInterestSection } = await import('./LaunchInterestSection')
const launch = findLaunchInterest('palm-springs-by-nakheel')!

describe('launch article register-interest section', () => {
  it('embeds the durable form with the launch attribution when intake is ready', () => {
    const html = renderToStaticMarkup(<LaunchInterestSection launch={launch} intakeReady />)
    expect(html).toContain('id="register-interest"')
    expect(html).toContain('data-surface="launch_article"')
    expect(html).toContain('data-launch="palm-springs-by-nakheel"')
    expect(html).toContain(launch.qualification)
    expect(html).not.toMatch(/reserve your|guaranteed|deposit now/i)
  })

  it('offers the sales inbox and WhatsApp instead of a dead form when intake is off', () => {
    const html = renderToStaticMarkup(<LaunchInterestSection launch={launch} intakeReady={false} />)
    expect(html).not.toContain('<form')
    expect(html).toContain('mailto:sales@hausofestate.com?subject=Palm%20Springs%20by%20Nakheel')
    expect(html).toContain('https://wa.me/971585607033')
    expect(html).toContain('/register-interest?launch=palm-springs-by-nakheel')
    expect(html).not.toContain('info@hausofestate.com')
  })

  it('lets a preview supply a simulated form and links the header call to action to the section', () => {
    const html = renderToStaticMarkup(<LaunchInterestSection launch={launch} intakeReady={false} form={<p>simulated</p>} />)
    expect(html).toContain('<p>simulated</p>')
    expect(html).not.toContain('mailto:')
    expect(renderToStaticMarkup(<LaunchInterestCta launch={launch} />)).toContain('href="#register-interest"')
  })
})
