import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatCents } from '../lib/money'
import type { BasketData } from '../types'

interface Props {
  /** Breakdown calculated by the backend; null while there is none yet. */
  summary: BasketData | null
  loading?: boolean
  error?: string | null
}

interface RowProps {
  label: string
  value: string
  loading: boolean
  color?: string
}

function Row({ label, value, loading, color }: RowProps) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={64} />
      ) : (
        <Typography variant="body2" sx={{ color, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>
      )}
    </Stack>
  )
}

export function BasketSummary({ summary, loading = false, error = null }: Props) {
  if (error) {
    return <Alert severity="error">Could not calculate the total: {error}</Alert>
  }

  const money = (cents: number | undefined) => (cents === undefined ? '—' : formatCents(cents))
  const isFreeDelivery = summary !== null && summary.delivery === 0 && summary.subtotal > 0

  return (
    <Stack spacing={1} aria-live="polite">
      <Row label="Subtotal" value={money(summary?.subtotal)} loading={loading} />
      {(loading || (summary?.discount ?? 0) > 0) && (
        <Row label="Offer discount" value={`−${money(summary?.discount)}`} loading={loading} color="success.main" />
      )}
      <Row label="Delivery" value={isFreeDelivery ? 'Free' : money(summary?.delivery)} loading={loading} />

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', pt: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Total
        </Typography>
        {loading ? (
          <Skeleton width={96} height={36} />
        ) : (
          <Typography
            variant="h5"
            component="p"
            data-testid="basket-total"
            sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          >
            {money(summary?.total)}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}