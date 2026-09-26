import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import type { Product, ProductCode } from '../types'
import { ProductCard } from './ProductCard'

interface Props {
  products: Product[]
  loading?: boolean
  onAdd: (code: ProductCode) => void
  addDisabled?: boolean
}

const CARD_SIZE = { xs: 12, sm: 6 } as const

export function ProductList({ products, loading = false, onAdd, addDisabled = false }: Props) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[0, 1, 2].map((key) => (
          <Grid key={key} size={CARD_SIZE}>
            <Skeleton variant="rounded" height={148} />
          </Grid>
        ))}
      </Grid>
    )
  }

  return (
    <Grid container spacing={2} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {products.map((product) => (
        <Grid key={product.code} size={CARD_SIZE} component="li">
          <ProductCard product={product} onAdd={onAdd} disabled={addDisabled} />
        </Grid>
      ))}
    </Grid>
  )
}
