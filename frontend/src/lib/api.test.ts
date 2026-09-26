import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CATALOGUE } from '../test/fixtures'
import { GENERIC_ERROR, NETWORK_ERROR, TOO_MANY_REQUESTS, UNEXPECTED_RESPONSE, calculateBasket, getProducts } from './api'

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

    it.each([400, 404, 500, 503])('throws a friendly error for status %i', async (status) => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'nope' }, status))

      await expect(getProducts()).rejects.toThrow(GENERIC_ERROR)
    })

    it('throws a friendly error when the network fails', async () => {
      fetchMock.mockImplementation(async () => {
        throw new TypeError('Failed to fetch')
      })

      await expect(getProducts()).rejects.toThrow(NETWORK_ERROR)
    })

    it('throws a friendly error for a body that is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('<html>not json</html>', { status: 200 }))

      await expect(getProducts()).rejects.toThrow(UNEXPECTED_RESPONSE)
    })

    it('throws a friendly error for JSON without a data envelope', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ products: CATALOGUE }))

      await expect(getProducts()).rejects.toThrow(UNEXPECTED_RESPONSE)
    })

    it('throws a friendly error for a JSON null body', async () => {
      fetchMock.mockResolvedValue(jsonResponse(null))

      await expect(getProducts()).rejects.toThrow(UNEXPECTED_RESPONSE)
    })

    it('throws a friendly error for a JSON scalar body', async () => {
      fetchMock.mockResolvedValue(jsonResponse('data'))

      await expect(getProducts()).rejects.toThrow(UNEXPECTED_RESPONSE)
    })

    it('never exposes the technical error message', async () => {
      fetchMock.mockImplementation(async () => {
        throw new TypeError('Failed to fetch')
      })

      await expect(getProducts()).rejects.not.toThrow('Failed to fetch')
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

    it('shows the first validation error returned by the API', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          { message: 'Validation error.', errors: { items: ['The items field must not have more than 100 items.'] } },
          422,
        ),
      )

      await expect(calculateBasket(['B01'])).rejects.toThrow('The items field must not have more than 100 items.')
    })

    it('skips validation fields without messages', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ message: 'Validation error.', errors: { items: [], 'items.0': ['The items.0 field must be a string.'] } }, 422),
      )

      await expect(calculateBasket(['B01'])).rejects.toThrow('The items.0 field must be a string.')
    })

    it('uses the API message when a 422 has no field errors', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Unknown product code [X99].', errors: null }, 422))

      await expect(calculateBasket(['X99'])).rejects.toThrow('Unknown product code [X99].')
    })

    it('uses the API message when the field errors have no usable message', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Validation error.', errors: { items: [42] } }, 422))

      await expect(calculateBasket(['X99'])).rejects.toThrow('Validation error.')
    })

    it('falls back to a generic error for a 422 without a message', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ errors: null }, 422))

      await expect(calculateBasket(['X99'])).rejects.toThrow(GENERIC_ERROR)
    })

    it('falls back to a generic error for a 422 whose message is not text', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: { text: 'nope' } }, 422))

      await expect(calculateBasket(['X99'])).rejects.toThrow(GENERIC_ERROR)
    })

    it('falls back to a generic error for a 422 that is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('<html>422</html>', { status: 422 }))

      await expect(calculateBasket(['X99'])).rejects.toThrow(GENERIC_ERROR)
    })

    it('asks the user to wait when rate limited', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Too Many Requests', errors: null }, 429))

      await expect(calculateBasket(['R01'])).rejects.toThrow(TOO_MANY_REQUESTS)
    })

    it.each([400, 401, 403, 404, 413, 500, 502, 503])('throws a friendly error for status %i', async (status) => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Internal Server Error', errors: null }, status))

      await expect(calculateBasket(['R01'])).rejects.toThrow(GENERIC_ERROR)
    })

    it('does not expose the server message for server errors', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'SQLSTATE[HY000] connection refused' }, 500))

      await expect(calculateBasket(['R01'])).rejects.not.toThrow('SQLSTATE')
    })

    it('throws a friendly error when the network fails', async () => {
      fetchMock.mockImplementation(async () => {
        throw new TypeError('Network down')
      })

      await expect(calculateBasket(['R01'])).rejects.toThrow(NETWORK_ERROR)
    })

    it('throws a friendly error for a body that is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('oops', { status: 200 }))

      await expect(calculateBasket(['R01'])).rejects.toThrow(UNEXPECTED_RESPONSE)
    })

    it('throws a friendly error for an HTML page served with status 200', async () => {
      fetchMock.mockResolvedValue(new Response('<html>502 Bad Gateway</html>', { status: 200 }))

      await expect(calculateBasket(['R01'])).rejects.toThrow(UNEXPECTED_RESPONSE)
    })
  })
})
