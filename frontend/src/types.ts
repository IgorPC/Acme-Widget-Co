export type ProductCode = string

export interface Product {
  code: ProductCode
  name: string
  price: number // in cents
}

export interface BasketData {
  items: ProductCode[]
  subtotal: number
  discount: number
  delivery: number
  total: number
}