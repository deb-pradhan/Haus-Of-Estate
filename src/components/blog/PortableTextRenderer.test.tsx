import { describe, expect, it } from 'vitest'
import { withDirhamSymbols } from './PortableTextRenderer'

const block = (text: string, marks: string[] = []) => ({
  _type: 'block', _key: 'b1', style: 'normal', markDefs: [],
  children: [{ _type: 'span', _key: 's1', text, marks }],
})

describe('withDirhamSymbols', () => {
  it('replaces the ISO code before an amount with an inline symbol node and keeps marks', () => {
    const [result] = withDirhamSymbols([block('from AED 3.8 million to AED 9 million', ['strong'])])
    expect(result.children.map((child: { _type: string; text?: string }) => child._type === 'span' ? child.text : '[AED]')).toEqual([
      'from ', '[AED]', '3.8 million to ', '[AED]', '9 million',
    ])
    expect(result.children.filter((child: { _type: string }) => child._type === 'span').every((child: { marks: string[] }) => child.marks.includes('strong'))).toBe(true)
    expect(new Set(result.children.map((child: { _key: string }) => child._key)).size).toBe(result.children.length)
  })

  it('leaves text without an amount, headings and non-block content untouched', () => {
    const plain = block('AED is the dirham; prices in AED are indicative.')
    const image = { _type: 'image', _key: 'i1', asset: { _ref: 'x' } }
    expect(withDirhamSymbols([plain, image])).toEqual([plain, image])
  })
})
