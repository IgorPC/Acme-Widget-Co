import { describe, expect, it } from 'vitest'
import { formatCents } from './money'

describe('formatCents', () => {
  it.each([
    [5437, '$54.37'],
    [0, '$0.00'],
    [795, '$7.95'],
    [1, '$0.01'],
    [10, '$0.10'],
    [99, '$0.99'],
    [100, '$1.00'],
    [100000, '$1,000.00'],
    [123456789, '$1,234,567.89'],
    [-150, '-$1.50'],
  ])('formats %i cents as %s', (cents, expected) => {
    expect(formatCents(cents)).toBe(expected)
  })

  it('always renders two decimal places', () => {
    expect(formatCents(2000)).toBe('$20.00')
  })

  it('is deterministic across calls', () => {
    expect(formatCents(100)).toBe(formatCents(100))
    expect(formatCents(100)).not.toBe(formatCents(200))
  })
})
