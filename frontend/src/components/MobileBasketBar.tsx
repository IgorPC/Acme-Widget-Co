import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatCents } from '../lib/money'

interface Props {
  itemCount: number
  total: number | null
  onViewBasket: () => void
}

export function MobileBasketBar({ itemCount, total, onViewBasket }: Props) {
  if (itemCount === 0) {
    return null
  }

  return (
    <Paper
      square
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        px: 2,
        py: 1.5,
        borderLeft: 0,
        borderRight: 0,
        borderBottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack>
          <Typography variant="caption" color="text.secondary">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {total === null ? '—' : formatCents(total)}
          </Typography>
        </Stack>
        <Button variant="contained" onClick={onViewBasket}>
          View basket
        </Button>
      </Stack>
    </Paper>
  )
}
