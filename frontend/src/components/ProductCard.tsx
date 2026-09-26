import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatCents } from '../lib/money'
import type { Product, ProductCode } from '../types'
import { ProductAvatar } from './ProductAvatar'

interface Props {
  product: Product
  onAdd: (code: ProductCode) => void
  disabled?: boolean
}

export function ProductCard({ product, onAdd, disabled = false }: Props) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <ProductAvatar product={product} size={48} />
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }} noWrap>
              {product.name}
            </Typography>
            <Chip label={product.code} size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
          </Stack>
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCents(product.price)}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddShoppingCartIcon />}
          onClick={() => onAdd(product.code)}
          disabled={disabled}
        >
          Add
        </Button>
      </CardActions>
    </Card>
  )
}
