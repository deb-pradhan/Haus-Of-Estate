import { describe, expect, it } from 'vitest'
import { preparePublicDesigns, preparePublicInteriorSchemes, type PropertyDesign } from './property-designs'
import { isConceptMedia, propertyMediaCaption } from './property-media'

const plan = 'https://cdn.sanity.io/images/jdxbkry4/production/cccccccccccccccccccccccccccccccccccccccc-1200x1800.jpg'
const design = {
  _key: 'villa-a', label: 'Villa A', position: 'standalone', sellableAreaSqFt: 4500.25, plotAreaSqFt: 6000.5,
  plotAreaStatus: 'brochure', areaNote: 'Plot figure as printed in the brochure.', brochureKey: 'florence-villa-a',
  images: [{ src: '/exterior.jpg', alt: 'Villa A exterior', label: 'Villa A — supplied design' }],
  floorPlans: [{ src: plan, alt: 'Villa A full ground and first floor plan' }],
} satisfies PropertyDesign

describe('public design whitelist', () => {
  it('keeps the figures, plans, public note and opaque brochure key a buyer needs', () => {
    expect(preparePublicDesigns([design])).toEqual([{
      _key: 'villa-a', label: 'Villa A', family: undefined, rowHomes: undefined, position: 'standalone',
      sellableAreaSqFt: 4500.25, plotAreaSqFt: 6000.5, plotAreaStatus: 'brochure',
      areaNote: 'Plot figure as printed in the brochure.', summary: undefined, brochureKey: 'florence-villa-a',
      images: [{ src: '/exterior.jpg', alt: 'Villa A exterior', label: 'Villa A — supplied design' }],
      floorPlans: [{ src: plan, alt: 'Villa A full ground and first floor plan' }],
    }])
  })

  it('withholds a disputed plot figure with its note, and never passes internal evidence on', () => {
    const [conflict] = preparePublicDesigns([{
      ...design, plotAreaStatus: 'conflict', plotAreaSqFt: 98765, areaNote: 'Internal area discrepancy',
      sourceEvidence: 'Private source notes', brochureRevision: 'rev-7',
    } as PropertyDesign])
    const serialized = JSON.stringify(conflict)
    expect(serialized).not.toMatch(/98765|Internal area discrepancy|Private source notes|rev-7/)
    expect(conflict.plotAreaStatus).toBe('conflict')
    expect(conflict.sellableAreaSqFt).toBe(4500.25)
    expect(serialized).toContain(plan)
  })

  it('drops designs without a usable area and images without a source or description', () => {
    expect(preparePublicDesigns([{ ...design, sellableAreaSqFt: undefined as unknown as number }])).toEqual([])
    expect(preparePublicDesigns(undefined)).toEqual([])
    const [scheme] = preparePublicInteriorSchemes([{ _key: 'warm', label: 'Warm scheme', images: [
      { src: '/warm.jpg', alt: 'Warm interior scheme from brochure' }, { src: '/untitled.jpg', alt: ' ' },
    ] }])
    expect(scheme.images).toEqual([{ src: '/warm.jpg', alt: 'Warm interior scheme from brochure' }])
  })
})

describe('concept image disclosure', () => {
  it('always discloses a concept, and never relabels a photograph or plan', () => {
    expect(propertyMediaCaption({ mediaKind: 'concept', caption: '   ' })).toMatch(/AI-assisted concept; not completed works/)
    expect(propertyMediaCaption({ mediaKind: 'concept-comparison' })).toMatch(/Existing view and proposed interiors/)
    expect(propertyMediaCaption({ mediaKind: 'photo' })).toBeUndefined()
    expect(isConceptMedia({ mediaKind: 'floor-plan' })).toBe(false)
  })
})
