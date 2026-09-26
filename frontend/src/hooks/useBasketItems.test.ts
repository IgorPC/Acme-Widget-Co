import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BLUE, CATALOGUE, GREEN, RED } from '../test/fixtures'
import type { Product } from '../types'
import { useBasketItems } from './useBasketItems'

describe('useBasketItems', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    expect(result.current.items).toEqual([])
    expect(result.current.lines).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('keeps the codes in the order they were added', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => {
      result.current.add('B01')
      result.current.add('R01')
      result.current.add('B01')
    })

    expect(result.current.items).toEqual(['B01', 'R01', 'B01'])
    expect(result.current.count).toBe(3)
  })

  it('groups the codes into lines, in catalogue order', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => {
      result.current.add('B01')
      result.current.add('R01')
      result.current.add('B01')
    })

    expect(result.current.lines.map((line) => [line.product.code, line.quantity])).toEqual([
      ['R01', 1],
      ['B01', 2],
    ])
  })

  it('exposes the catalogue product instances in the lines', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.add('G01'))

    expect(result.current.lines[0].product).toBe(GREEN)
  })

  it('omits products that are not in the basket', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.add('G01'))

    expect(result.current.lines.map((line) => line.product.code)).toEqual(['G01'])
  })

  it('keeps unknown codes in items but leaves them out of the lines', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => {
      result.current.add('X99')
      result.current.add('R01')
    })

    expect(result.current.items).toEqual(['X99', 'R01'])
    expect(result.current.count).toBe(2)
    expect(result.current.lines).toHaveLength(1)
    expect(result.current.lines[0].product.code).toBe('R01')
  })

  it('returns no lines when the catalogue is empty', () => {
    const { result } = renderHook(() => useBasketItems([]))

    act(() => result.current.add('R01'))

    expect(result.current.items).toEqual(['R01'])
    expect(result.current.lines).toEqual([])
  })

  it('treats codes as case sensitive', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.add('r01'))

    expect(result.current.lines).toEqual([])
  })

  it('counts a large quantity of the same product', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => {
      for (let i = 0; i < 50; i++) result.current.add('R01')
    })

    expect(result.current.count).toBe(50)
    expect(result.current.lines).toEqual([{ product: RED, quantity: 50 }])
  })

  it('removes only one unit of a product', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => {
      result.current.add('R01')
      result.current.add('R01')
    })
    act(() => result.current.removeOne('R01'))

    expect(result.current.items).toEqual(['R01'])
    expect(result.current.count).toBe(1)
  })

  it('removes the most recently added unit of a product', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => {
      result.current.add('R01')
      result.current.add('G01')
      result.current.add('R01')
      result.current.add('B01')
    })
    act(() => result.current.removeOne('R01'))

    expect(result.current.items).toEqual(['R01', 'G01', 'B01'])
  })

  it('drops the line when its last unit is removed', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => {
      result.current.add('R01')
      result.current.add('G01')
    })
    act(() => result.current.removeOne('R01'))

    expect(result.current.lines.map((line) => line.product.code)).toEqual(['G01'])
  })

  it('ignores removing a product that is not in the basket', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.add('R01'))
    act(() => result.current.removeOne('G01'))

    expect(result.current.items).toEqual(['R01'])
  })

  it('keeps the same items reference when nothing was removed', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.add('R01'))
    const before = result.current.items
    act(() => result.current.removeOne('G01'))

    expect(result.current.items).toBe(before)
  })

  it('ignores removing from an empty basket', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.removeOne('R01'))

    expect(result.current.items).toEqual([])
  })

  it('clears the basket', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => {
      result.current.add('R01')
      result.current.add('G01')
    })
    act(() => result.current.clear())

    expect(result.current.items).toEqual([])
    expect(result.current.lines).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('clears an empty basket without error', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.clear())

    expect(result.current.items).toEqual([])
  })

  it('allows adding again after clearing', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.add('R01'))
    act(() => result.current.clear())
    act(() => result.current.add('B01'))

    expect(result.current.items).toEqual(['B01'])
  })

  it('does not mutate the previous items array', () => {
    const { result } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.add('R01'))
    const before = result.current.items
    act(() => result.current.add('G01'))

    expect(before).toEqual(['R01'])
    expect(result.current.items).not.toBe(before)
  })

  it('keeps the lines reference stable while nothing changes', () => {
    const { result, rerender } = renderHook(() => useBasketItems(CATALOGUE))

    act(() => result.current.add('R01'))
    const before = result.current.lines
    rerender()

    expect(result.current.lines).toBe(before)
  })

  it('recomputes the lines when the catalogue changes', () => {
    const { result, rerender } = renderHook(({ products }) => useBasketItems(products), {
      initialProps: { products: [] as Product[] },
    })

    act(() => {
      result.current.add('R01')
      result.current.add('B01')
    })
    expect(result.current.lines).toEqual([])

    rerender({ products: [BLUE, RED] })

    expect(result.current.lines.map((line) => line.product.code)).toEqual(['B01', 'R01'])
  })

  it('reflects price changes of the catalogue in the lines', () => {
    const { result, rerender } = renderHook(({ products }) => useBasketItems(products), {
      initialProps: { products: [RED] },
    })

    act(() => result.current.add('R01'))
    rerender({ products: [{ ...RED, price: 1000 }] })

    expect(result.current.lines[0].product.price).toBe(1000)
  })
})
