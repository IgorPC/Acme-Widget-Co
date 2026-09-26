import { useEffect, useState } from 'react'
import { calculateBasket } from '../lib/api'
import type { ProductCode, BasketData } from '../types'

const EMPTY_BASKET: BasketData = { items: [], subtotal: 0, discount: 0, delivery: 0, total: 0 }

interface Result {
  items: ProductCode[] | null
  attempt: number
  summary: BasketData | null
  error: string | null
}

export function useBasketTotal(items: ProductCode[]) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result>({ items: null, attempt: 0, summary: null, error: null })

  useEffect(() => {
    if (items.length === 0) return

    let ignore = false

    calculateBasket(items)
      .then((data) => {
        if (!ignore) setResult({ items, attempt, summary: data, error: null })
      })
      .catch((e: Error) => {
        if (!ignore) setResult({ items, attempt, summary: null, error: e.message })
      })

    return () => {
      ignore = true
    }
  }, [items, attempt])

  const retry = () => setAttempt((current) => current + 1)

  if (items.length === 0) {
    return { summary: EMPTY_BASKET, loading: false, error: null, retry }
  }

  const loading = result.items !== items || result.attempt !== attempt

  return { summary: loading ? null : result.summary, loading, error: loading ? null : result.error, retry }
}
