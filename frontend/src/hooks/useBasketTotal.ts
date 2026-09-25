import { useEffect, useState } from 'react'
import { calculateBasket } from '../lib/api'
import type { ProductCode } from '../types'

interface Result {
  items: ProductCode[] | null
  total: number | null
  error: string | null
}

export function useBasketTotal(items: ProductCode[]) {
  const [result, setResult] = useState<Result>({ items: null, total: null, error: null })

  useEffect(() => {
    if (items.length === 0) return 

    let ignore = false

    calculateBasket(items)
      .then((data) => {
        if (!ignore) setResult({ items, total: data.total, error: null })
      })
      .catch((e: Error) => {
        if (!ignore) setResult({ items, total: null, error: e.message })
      })

    return () => {
      ignore = true
    }
  }, [items])

  if (items.length === 0) {
    return { total: 0, loading: false, error: null }
  }

  const loading = result.items !== items

  return { total: loading ? null : result.total, loading, error: loading ? null : result.error }
}