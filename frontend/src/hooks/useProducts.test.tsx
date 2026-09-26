import { act, renderHook, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProducts } from '../lib/api'
import { CATALOGUE, RED } from '../test/fixtures'
import { createDeferred } from '../test/utils'
import type { Product } from '../types'
import { useProducts } from './useProducts'

vi.mock('../lib/api', () => ({
  getProducts: vi.fn(),
}))

const mockedGetProducts = vi.mocked(getProducts)

describe('useProducts', () => {
  beforeEach(() => {
    mockedGetProducts.mockReset()
  })

  it('starts in the loading state with no products and no error', () => {
    mockedGetProducts.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useProducts())

    expect(result.current).toEqual({ products: [], loading: true, error: null })
  })

  it('loads the catalogue', async () => {
    mockedGetProducts.mockResolvedValue([RED])

    const { result } = renderHook(() => useProducts())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.products).toEqual([RED])
    expect(result.current.error).toBeNull()
  })

  it('loads an empty catalogue', async () => {
    mockedGetProducts.mockResolvedValue([])

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.products).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('preserves the order returned by the API', async () => {
    mockedGetProducts.mockResolvedValue(CATALOGUE)

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.products).toHaveLength(3))
    expect(result.current.products.map((product) => product.code)).toEqual(['R01', 'G01', 'B01'])
  })

  it('exposes the API error', async () => {
    mockedGetProducts.mockImplementation(async () => {
      throw new Error('offline')
    })

    const { result } = renderHook(() => useProducts())

    await waitFor(() => expect(result.current.error).toBe('offline'))
    expect(result.current.loading).toBe(false)
    expect(result.current.products).toEqual([])
  })

  it('requests the catalogue only once across re-renders', async () => {
    mockedGetProducts.mockResolvedValue([RED])

    const { result, rerender } = renderHook(() => useProducts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender()
    rerender()

    expect(mockedGetProducts).toHaveBeenCalledTimes(1)
  })

  it('ignores a response that arrives after unmount', async () => {
    const pending = createDeferred<Product[]>()
    mockedGetProducts.mockImplementation(() => pending.promise)

    const { unmount } = renderHook(() => useProducts())
    unmount()

    await expect(
      act(async () => {
        pending.resolve([RED])
      }),
    ).resolves.toBeUndefined()
  })

  it('ignores an error that arrives after unmount', async () => {
    const pending = createDeferred<Product[]>()
    mockedGetProducts.mockImplementation(() => pending.promise)

    const { unmount } = renderHook(() => useProducts())
    unmount()

    await expect(
      act(async () => {
        pending.reject(new Error('too late'))
      }),
    ).resolves.toBeUndefined()
  })

  it('settles with the latest data under StrictMode double invocation', async () => {
    mockedGetProducts.mockResolvedValue(CATALOGUE)

    const { result } = renderHook(() => useProducts(), { wrapper: StrictMode })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.products).toEqual(CATALOGUE)
    expect(mockedGetProducts).toHaveBeenCalledTimes(2)
  })
})
