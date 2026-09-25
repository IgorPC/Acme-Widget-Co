import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { BasketLine } from '../hooks/useBasketItems'
import type { ProductCode } from '../types'
import { BasketItems } from './BasketItems'
import { BasketSummary } from './BasketSummary'
import { EmptyBasket } from './EmptyBasket'

interface Props {
  lines: BasketLine[]
  total: number | null
  loading?: boolean
  error?: string | null
  onAdd: (code: ProductCode) => void
  onRemove: (code: ProductCode) => void
  onClear: () => void
}

export function BasketPanel({ lines, total, loading, error, onAdd, onRemove, onClear }: Props) {
  const isEmpty = lines.length === 0

  return (
    <Card component="section" aria-labelledby="basket-title">
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography id="basket-title" variant="h2">
            Basket
          </Typography>
          {!isEmpty && (
            <Button size="small" onClick={onClear}>
              Clear
            </Button>
          )}
        </Stack>

        {isEmpty ? <EmptyBasket /> : <BasketItems lines={lines} onAdd={onAdd} onRemove={onRemove} />}

        <Divider sx={{ my: 2 }} />

        <BasketSummary total={isEmpty ? 0 : total} loading={loading} error={error} />
      </CardContent>
    </Card>
  )
}
