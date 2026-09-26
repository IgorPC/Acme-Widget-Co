import { useEffect, useState } from 'react'
import { getProducts } from '../lib/api'
import type { Product } from '../types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    getProducts()
      .then((data) => {
        if (!ignore) setProducts(data)
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  const retry = () => {
    setError(null)
    setLoading(true)
    setAttempt((current) => current + 1)
  }

  return { products, loading, error, retry }
}
