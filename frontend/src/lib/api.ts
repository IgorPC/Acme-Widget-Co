import type { BasketData, Product, ProductCode } from '../types'

export const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.'
export const UNEXPECTED_RESPONSE = 'The server sent an unexpected response. Please try again.'
export const TOO_MANY_REQUESTS = 'Too many requests. Please wait a moment and try again.'
export const GENERIC_ERROR = 'Something went wrong. Please try again.'

interface ErrorBody {
  message?: unknown
  errors?: unknown
}

function firstValidationError(errors: unknown): string | null {
  if (typeof errors !== 'object' || errors === null) return null

  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0]
  }

  return null
}

function errorMessage(status: number, body: ErrorBody | null): string {
  if (status === 422) {
    return firstValidationError(body?.errors) ?? (typeof body?.message === 'string' ? body.message : GENERIC_ERROR)
  }

  if (status === 429) return TOO_MANY_REQUESTS

  return GENERIC_ERROR
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  const body = await readJson(response)

  if (!response.ok) {
    throw new Error(errorMessage(response.status, body as ErrorBody | null))
  }

  if (typeof body !== 'object' || body === null || !('data' in body)) {
    throw new Error(UNEXPECTED_RESPONSE)
  }

  return body as T
}

export async function getProducts(): Promise<Product[]> {
  const body = await request<{ data: Product[] }>('/api/products')
  return body.data
}

export async function calculateBasket(items: ProductCode[]): Promise<BasketData> {
  const body = await request<{ data: BasketData }>('/api/basket', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
  return body.data
}
