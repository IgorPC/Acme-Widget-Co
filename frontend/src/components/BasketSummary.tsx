import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatCents } from '../lib/money'

interface Props {
  total: number | null
  loading?: boolean
  error?: string | null
}

export function BasketSummary({ total, loading = false, error = null }: Props) {
  if (error) {
    return <Alert severity="error">Could not calculate the total: {error}</Alert>
  }

  return (
    <Stack spacing={0.5} aria-live="polite">
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Total
        </Typography>
        {loading ? (
          <Skeleton width={96} height={36} />
        ) : (
          <Typography variant="h5" component="p" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {total === null ? '—' : formatCents(total)}
          </Typography>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Includes offers and delivery.
      </Typography>
    </Stack>
  )
}
