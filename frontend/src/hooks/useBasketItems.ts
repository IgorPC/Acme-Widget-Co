import { useMemo, useState } from 'react'
import type { Product, ProductCode } from '../types'

export const MAX_BASKET_ITEMS = 100

export interface BasketLine {
  product: Product
  quantity: number
}

export function useBasketItems(products: Product[]) {
  const [items, setItems] = useState<ProductCode[]>([])

  const add = (code: ProductCode) =>
    setItems((current) => (current.length >= MAX_BASKET_ITEMS ? current : [...current, code]))

  const removeOne = (code: ProductCode) =>
    setItems((current) => {
      const index = current.lastIndexOf(code)
      return index === -1 ? current : current.toSpliced(index, 1)
    })

  const clear = () => setItems([])

  const lines = useMemo<BasketLine[]>(
    () =>
      products
        .map((product) => ({
          product,
          quantity: items.filter((code) => code === product.code).length,
        }))
        .filter((line) => line.quantity > 0),
    [items, products],
  )

  return { items, lines, count: items.length, isFull: items.length >= MAX_BASKET_ITEMS, add, removeOne, clear }
}
