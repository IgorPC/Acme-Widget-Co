import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { BasketLine } from '../hooks/useBasketItems'
import type { ProductCode } from '../types'
import { ProductAvatar } from './ProductAvatar'

interface Props {
  lines: BasketLine[]
  onAdd: (code: ProductCode) => void
  onRemove: (code: ProductCode) => void
}

export function BasketItems({ lines, onAdd, onRemove }: Props) {
  return (
    <List disablePadding>
      {lines.map(({ product, quantity }) => (
        <ListItem key={product.code} disableGutters sx={{ gap: 1.5 }}>
          <ProductAvatar product={product} size={36} />
          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {product.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {product.code}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <IconButton size="small" onClick={() => onRemove(product.code)} aria-label={`Remove one ${product.name}`}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="body2"
              sx={{ minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
              aria-label={`Quantity: ${quantity}`}
            >
              {quantity}
            </Typography>
            <IconButton size="small" onClick={() => onAdd(product.code)} aria-label={`Add one ${product.name}`}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Stack>
        </ListItem>
      ))}
    </List>
  )
}
