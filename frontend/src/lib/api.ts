import type { BasketData, Product, ProductCode } from '../types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
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