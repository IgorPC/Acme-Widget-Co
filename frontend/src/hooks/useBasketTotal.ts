import { useEffect, useState } from 'react'
import { calculateBasket } from '../lib/api'
import type { ProductCode, BasketData } from '../types'

const EMPTY_BASKET: BasketData = { items: [], subtotal: 0, discount: 0, delivery: 0, total: 0 }

interface Result {
  items: ProductCode[] | null
  summary: BasketData | null
  error: string | null
}

export function useBasketTotal(items: ProductCode[]) {
  const [result, setResult] = useState<Result>({ items: null, summary: null, error: null })

  useEffect(() => {
    if (items.length === 0) return 

    let ignore = false

    calculateBasket(items)
      .then((data) => {
        if (!ignore) setResult({ items, summary: data, error: null })
      })
      .catch((e: Error) => {
        if (!ignore) setResult({ items, summary: null, error: e.message })
      })

    return () => {
      ignore = true
    }
  }, [items])

  if (items.length === 0) {
    return { summary: EMPTY_BASKET, loading: false, error: null }
  }

  const loading = result.items !== items

  return { summary: loading ? null : result.summary, loading, error: loading ? null : result.error }
}