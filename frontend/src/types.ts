export type ProductCode = string

export interface Product {
  code: ProductCode
  name: string
  price: number // in cents
}

export interface BasketTotal {
  items: ProductCode[]
  total: number // in cents
}