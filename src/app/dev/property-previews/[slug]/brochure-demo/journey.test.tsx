import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BrochureJourneyDemo } from './journey'

vi.mock('@/components/lead-eoi/lead-eoi-form', () => ({ LeadEoiForm: () => null }))

const project = { slug: 'azizi-florence-4-bedroom-villas', title: 'Florence 4-bedroom villas' }
const design = {
  id: 'villa-type-a', label: 'Type A', brochureKey: 'villa-4br',
  image: { src: '/design.webp', alt: 'Type A exterior' },
  sellableAreaSqFt: 1234.56,
  plotAreaSqFt: 876543.21,
}

describe('brochure journey area evidence', () => {
  it.each([undefined, design.id])('withholds a conflicting plot value with initial design %s', (initialDesignId) => {
    const html = renderToStaticMarkup(<BrochureJourneyDemo project={project}
      designs={[{ ...design, plotAreaStatus: 'conflict' }]} initialDesignId={initialDesignId} />)

    expect(html).toContain('Built-up area')
    expect(html).toContain('1,234.56')
    expect(html).toContain('To be confirmed')
    expect(html).not.toContain('876,543.21')
    expect(html).not.toContain('876543.21')
    expect(html).not.toContain('Sellable area')
  })

  it('shows the brochure plot value when it has no conflict', () => {
    const html = renderToStaticMarkup(<BrochureJourneyDemo project={project}
      designs={[{ ...design, plotAreaStatus: 'brochure' }]} initialDesignId={design.id} />)

    expect(html).toContain('876,543.21')
    expect(html).not.toContain('To be confirmed')
  })
})
