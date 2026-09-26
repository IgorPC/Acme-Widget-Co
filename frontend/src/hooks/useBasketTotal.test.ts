import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateBasket } from '../lib/api'
import { summaryFor } from '../test/fixtures'
import { createDeferred } from '../test/utils'
import type { BasketData, ProductCode } from '../types'
import { useBasketTotal } from './useBasketTotal'

vi.mock('../lib/api', () => ({
  calculateBasket: vi.fn(),
}))

const mockedCalculate = vi.mocked(calculateBasket)

const RED_TWICE: ProductCode[] = ['R01', 'R01']
const RED: ProductCode[] = ['R01']
const RED_GREEN: ProductCode[] = ['R01', 'G01']
const EMPTY: ProductCode[] = []

describe('useBasketTotal', () => {
  beforeEach(() => {
    mockedCalculate.mockReset()
  })

  it('returns an all-zero summary for an empty basket without calling the API', () => {
    const { result } = renderHook(() => useBasketTotal(EMPTY))

    expect(result.current.summary).toEqual({ items: [], subtotal: 0, discount: 0, delivery: 0, total: 0 })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockedCalculate).not.toHaveBeenCalled()
  })

  it('returns the summary calculated by the API', async () => {
    mockedCalculate.mockResolvedValue({
      items: ['R01', 'R01'],
      subtotal: 6590,
      discount: 1648,
      delivery: 495,
      total: 5437,
    })

    const { result } = renderHook(() => useBasketTotal(RED_TWICE))

    expect(result.current.loading).toBe(true)
    expect(result.current.summary).toBeNull()
    await waitFor(() => expect(result.current.summary?.total).toBe(5437))
    expect(result.current.summary?.discount).toBe(1648)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockedCalculate).toHaveBeenCalledWith(['R01', 'R01'])
    expect(mockedCalculate).toHaveBeenCalledTimes(1)
  })

  it('does not recalculate when re-rendered with the same items reference', async () => {
    mockedCalculate.mockResolvedValue(summaryFor(RED, 100))

    const { result, rerender } = renderHook(() => useBasketTotal(RED))
    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender()
    rerender()

    expect(mockedCalculate).toHaveBeenCalledTimes(1)
  })

  it('recalculates when the items change', async () => {
    mockedCalculate.mockImplementation(async (items) => summaryFor(items, items.length * 100))

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })
    await waitFor(() => expect(result.current.summary?.total).toBe(100))

    rerender({ items: RED_GREEN })
    await waitFor(() => expect(result.current.summary?.total).toBe(200))

    expect(mockedCalculate).toHaveBeenCalledTimes(2)
    expect(mockedCalculate).toHaveBeenLastCalledWith(['R01', 'G01'])
  })

  it('reports loading and hides the previous summary while a new calculation is pending', async () => {
    const second = createDeferred<BasketData>()
    mockedCalculate.mockResolvedValueOnce(summaryFor(RED, 100)).mockImplementationOnce(() => second.promise)

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })
    await waitFor(() => expect(result.current.summary?.total).toBe(100))

    rerender({ items: RED_GREEN })

    expect(result.current.loading).toBe(true)
    expect(result.current.summary).toBeNull()
    expect(result.current.error).toBeNull()

    await act(async () => second.resolve(summaryFor(RED_GREEN, 200)))

    expect(result.current.loading).toBe(false)
    expect(result.current.summary?.total).toBe(200)
  })

  it('ignores a response that arrives after the basket has changed', async () => {
    const first = createDeferred<BasketData>()
    mockedCalculate
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(async (items) => summaryFor(items, 200))

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })

    rerender({ items: RED_GREEN })
    await waitFor(() => expect(result.current.summary?.total).toBe(200))

    await act(async () => first.resolve(summaryFor(RED, 100)))

    expect(result.current.summary?.total).toBe(200)
    expect(result.current.loading).toBe(false)
  })

  it('ignores an error that arrives after the basket has changed', async () => {
    const first = createDeferred<BasketData>()
    mockedCalculate
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(async (items) => summaryFor(items, 200))

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })

    rerender({ items: RED_GREEN })
    await waitFor(() => expect(result.current.summary?.total).toBe(200))

    await act(async () => first.reject(new Error('late failure')))

    expect(result.current.error).toBeNull()
    expect(result.current.summary?.total).toBe(200)
  })

  it('ignores a response that arrives after unmount', async () => {
    const pending = createDeferred<BasketData>()
    mockedCalculate.mockImplementation(() => pending.promise)

    const { unmount } = renderHook(() => useBasketTotal(RED))
    unmount()

    await expect(
      act(async () => {
        pending.resolve(summaryFor(RED, 100))
      }),
    ).resolves.toBeUndefined()
  })

  it('ignores an error that arrives after unmount', async () => {
    const pending = createDeferred<BasketData>()
    mockedCalculate.mockImplementation(() => pending.promise)

    const { unmount } = renderHook(() => useBasketTotal(RED))
    unmount()

    await expect(
      act(async () => {
        pending.reject(new Error('too late'))
      }),
    ).resolves.toBeUndefined()
  })

  it('exposes the API error', async () => {
    mockedCalculate.mockImplementation(async () => {
      throw new Error('boom')
    })

    const { result } = renderHook(() => useBasketTotal(RED))

    await waitFor(() => expect(result.current.error).toBe('boom'))
    expect(result.current.summary).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('clears the error when the items change and the new calculation succeeds', async () => {
    mockedCalculate
      .mockImplementationOnce(async () => {
        throw new Error('boom')
      })
      .mockImplementationOnce(async (items) => summaryFor(items, 200))

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })
    await waitFor(() => expect(result.current.error).toBe('boom'))

    rerender({ items: RED_GREEN })

    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.summary?.total).toBe(200))
    expect(result.current.error).toBeNull()
  })

  it('shows a fresh error after a previous success', async () => {
    mockedCalculate
      .mockImplementationOnce(async (items) => summaryFor(items, 100))
      .mockImplementationOnce(async () => {
        throw new Error('second failed')
      })

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })
    await waitFor(() => expect(result.current.summary?.total).toBe(100))

    rerender({ items: RED_GREEN })

    await waitFor(() => expect(result.current.error).toBe('second failed'))
    expect(result.current.summary).toBeNull()
  })

  it('returns to the empty summary without calling the API when the basket is emptied', async () => {
    mockedCalculate.mockImplementation(async (items) => summaryFor(items, 100))

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })
    await waitFor(() => expect(result.current.summary?.total).toBe(100))

    rerender({ items: EMPTY })

    expect(result.current.summary?.total).toBe(0)
    expect(result.current.loading).toBe(false)
    expect(mockedCalculate).toHaveBeenCalledTimes(1)
  })

  it('discards an in-flight response when the basket is emptied', async () => {
    const pending = createDeferred<BasketData>()
    mockedCalculate.mockImplementation(() => pending.promise)

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })

    rerender({ items: EMPTY })
    await act(async () => pending.resolve(summaryFor(RED, 100)))

    expect(result.current.summary?.total).toBe(0)
    expect(result.current.loading).toBe(false)
  })

  it('never returns a summary for a different set of items than requested', async () => {
    const first = createDeferred<BasketData>()
    mockedCalculate
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(async (items) => summaryFor(items, 500))

    const { result, rerender } = renderHook(({ items }) => useBasketTotal(items), {
      initialProps: { items: RED },
    })
    rerender({ items: RED_GREEN })

    await waitFor(() => expect(result.current.summary?.items).toEqual(['R01', 'G01']))
    await act(async () => first.resolve(summaryFor(RED, 100)))

    expect(result.current.summary?.items).toEqual(['R01', 'G01'])
  })
})
