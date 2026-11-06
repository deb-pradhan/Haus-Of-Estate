import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BrochureRequestJourney, type RequestDesign, type RequestProject } from './brochure-request'

vi.mock('next/navigation', () => ({ usePathname: () => '/showcase/properties/azizi-florence-4-bedroom-townhouses/request' }))
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}))

const project: RequestProject = {
  slug: 'azizi-florence-4-bedroom-townhouses',
  title: 'Azizi Florence — 4-Bedroom Townhouses',
  label: '4-bedroom townhouses',
  community: 'Florence',
  city: 'Sharjah',
  country: 'United Arab Emirates',
  communityTitle: 'Azizi Florence',
}

const designs: RequestDesign[] = [
  {
    id: 'novoli-4-home-corner',
    label: 'Novoli - 4-home row - corner',
    family: 'Novoli',
    rowHomes: 4,
    position: 'corner',
    brochureKey: 'townhouse-3-4br',
    builtUpAreaSqFt: 2711,
    plotAreaStatus: 'conflict',
    areaNote: 'Plot area is withheld while the source brochure table and diagram are reconciled.',
    image: { src: 'https://cdn.sanity.io/images/jdxbkry4/production/a.jpg', alt: 'Novoli row', label: 'Novoli 4-home row — shared row view' },
  },
  {
    id: 'spada-4-home-corner',
    label: 'Spada - 4-home row - corner',
    family: 'Spada',
    rowHomes: 4,
    position: 'corner',
    brochureKey: 'townhouse-3-4br',
    builtUpAreaSqFt: 2709,
    plotAreaSqFt: 2260,
    plotAreaStatus: 'brochure',
    image: { src: 'https://cdn.sanity.io/images/jdxbkry4/production/b.jpg', alt: 'Spada row', label: 'Spada 4-home row — shared row view' },
  },
]

function render(initialDesignId?: string) {
  return renderToStaticMarkup(createElement(BrochureRequestJourney, {
    project, designs, initialDesignId, areaLabel: 'Built-up area',
    areaSourceLabel: 'The brochure labels this figure sellable area.',
  }))
}

describe('simulated brochure request before hydration', () => {
  it('renders an inert form: no field names, disabled submit, no submission target', () => {
    const html = render('spada-4-home-corner')
    const form = html.match(/<form[^>]*>/)?.[0] ?? ''
    expect(form).not.toMatch(/\baction=/)
    expect(form).not.toMatch(/\bmethod=/)
    expect(html).not.toMatch(/<(input|textarea|select)[^>]*\bname=/)
    const submit = html.match(/<button[^>]*type="submit"[^>]*>/)?.[0] ?? ''
    expect(submit).toContain('disabled')
    expect(html).toContain('Loading the preview')
    expect(html).toContain('<noscript>')
    expect(html).not.toMatch(/<input[^>]*type="checkbox"[^>]*checked/)
  })

  it('carries the chosen design, its source and withheld-plot notes and the row caption', () => {
    const html = render('novoli-4-home-corner')
    expect(html).toContain('Novoli - 4-home row - corner')
    expect(html).toContain('Novoli 4-home row — shared row view')
    expect(html).toContain('The brochure labels this figure sellable area.')
    expect(html).toContain('Plot area is withheld while the source brochure table and diagram are reconciled.')
    expect(html).toContain('Withheld')
    expect(html).toContain('Row views and plans show all 4 homes in the row')
    expect(html).toContain('Back to Novoli - 4-home row - corner')
  })

  it('asks for a design first when none is preselected', () => {
    const html = render()
    expect(html).toContain('Choose a design')
    expect(html).toContain('Spada - 4-home row - corner')
    expect(html).toContain('Novoli - 4-home row - corner')
  })
})
