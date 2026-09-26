import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { MAX_BASKET_ITEMS, type BasketLine } from '../hooks/useBasketItems'
import type { BasketData, ProductCode } from '../types'
import { BasketItems } from './BasketItems'
import { BasketSummary } from './BasketSummary'
import { EmptyBasket } from './EmptyBasket'

interface Props {
  lines: BasketLine[]
  summary: BasketData | null
  loading?: boolean
  error?: string | null
  isFull?: boolean
  onAdd: (code: ProductCode) => void
  onRemove: (code: ProductCode) => void
  onClear: () => void
  onRetry?: () => void
}

export function BasketPanel({
  lines,
  summary,
  loading,
  error,
  isFull = false,
  onAdd,
  onRemove,
  onClear,
  onRetry,
}: Props) {
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

        {isEmpty ? (
          <EmptyBasket />
        ) : (
          <BasketItems lines={lines} onAdd={onAdd} onRemove={onRemove} addDisabled={isFull} />
        )}

        {isFull && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Your basket is full. The maximum is {MAX_BASKET_ITEMS} items.
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <BasketSummary summary={summary} loading={loading} error={error} onRetry={onRetry} />
      </CardContent>
    </Card>
  )
}
