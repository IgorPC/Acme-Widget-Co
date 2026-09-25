import Avatar from '@mui/material/Avatar'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import type { Product } from '../types'

const COLORS: Record<string, string> = {
  R: '#dc2626',
  G: '#16a34a',
  B: '#2563eb',
}

interface Props {
  product: Product
  size?: number
}

export function ProductAvatar({ product, size = 40 }: Props) {
  const color = COLORS[product.code.charAt(0)] ?? '#6b7280'

  return (
    <Avatar
      variant="rounded"
      sx={{ width: size, height: size, bgcolor: `${color}1a`, color }}
      aria-hidden
    >
      <WidgetsOutlinedIcon fontSize={size > 40 ? 'medium' : 'small'} />
    </Avatar>
  )
}
