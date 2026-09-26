import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CATALOGUE } from '../test/fixtures'
import { calculateBasket, getProducts } from './api'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' }

describe('api', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  describe('getProducts', () => {
    it('requests the products endpoint with JSON headers', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: CATALOGUE }))

      await getProducts()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith('/api/products', { headers: HEADERS })
    })

    it('unwraps the data envelope', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: CATALOGUE }))

      await expect(getProducts()).resolves.toEqual(CATALOGUE)
    })

    it('returns an empty list when the catalogue is empty', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: [] }))

      await expect(getProducts()).resolves.toEqual([])
    })

    it.each([400, 404, 422, 500, 503])('throws a descriptive error for status %i', async (status) => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'nope' }, status))

      await expect(getProducts()).rejects.toThrow(`Request to /api/products failed with status ${status}`)
    })

    it('propagates network failures', async () => {
      fetchMock.mockImplementation(async () => {
        throw new TypeError('Failed to fetch')
      })

      await expect(getProducts()).rejects.toThrow('Failed to fetch')
    })

    it('propagates invalid JSON bodies', async () => {
      fetchMock.mockResolvedValue(new Response('<html>not json</html>', { status: 200 }))

      await expect(getProducts()).rejects.toThrow()
    })

    it('does not read the body of a failed response', async () => {
      const response = jsonResponse({ data: CATALOGUE }, 500)
      const jsonSpy = vi.spyOn(response, 'json')
      fetchMock.mockResolvedValue(response)

      await expect(getProducts()).rejects.toThrow()
      expect(jsonSpy).not.toHaveBeenCalled()
    })
  })

  describe('calculateBasket', () => {
    const summary = { items: ['R01', 'R01'], subtotal: 6590, discount: 1648, delivery: 495, total: 5437 }

    it('posts the codes as JSON to the basket endpoint', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: summary }))

      await calculateBasket(['R01', 'R01'])

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith('/api/basket', {
        method: 'POST',
        body: JSON.stringify({ items: ['R01', 'R01'] }),
        headers: HEADERS,
      })
    })

    it('unwraps the data envelope', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: summary }))

      await expect(calculateBasket(['R01', 'R01'])).resolves.toEqual(summary)
    })

    it('preserves the order and duplicates of the codes', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: summary }))

      await calculateBasket(['B01', 'R01', 'B01'])

      const init = fetchMock.mock.calls[0][1]
      expect(JSON.parse(init?.body as string)).toEqual({ items: ['B01', 'R01', 'B01'] })
    })

    it('serialises an empty basket', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: summary }))

      await calculateBasket([])

      expect(fetchMock.mock.calls[0][1]?.body).toBe('{"items":[]}')
    })

    it.each([400, 404, 422, 500])('throws a descriptive error for status %i', async (status) => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'invalid' }, status))

      await expect(calculateBasket(['X99'])).rejects.toThrow(`Request to /api/basket failed with status ${status}`)
    })

    it('propagates network failures', async () => {
      fetchMock.mockImplementation(async () => {
        throw new TypeError('Network down')
      })

      await expect(calculateBasket(['R01'])).rejects.toThrow('Network down')
    })

    it('propagates invalid JSON bodies', async () => {
      fetchMock.mockResolvedValue(new Response('oops', { status: 200 }))

      await expect(calculateBasket(['R01'])).rejects.toThrow()
    })
  })
})
