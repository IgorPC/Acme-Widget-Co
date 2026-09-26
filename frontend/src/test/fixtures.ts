import type { BasketData, Product } from '../types'

export const RED: Product = { code: 'R01', name: 'Red Widget', price: 3295 }
export const GREEN: Product = { code: 'G01', name: 'Green Widget', price: 2495 }
export const BLUE: Product = { code: 'B01', name: 'Blue Widget', price: 795 }

export const CATALOGUE: Product[] = [RED, GREEN, BLUE]

export const summaryFor = (items: string[], total: number): BasketData => ({
  items,
  subtotal: total,
  discount: 0,
  delivery: 0,
  total,
})
