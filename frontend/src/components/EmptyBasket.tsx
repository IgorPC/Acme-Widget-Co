import RemoveShoppingCartOutlinedIcon from '@mui/icons-material/RemoveShoppingCartOutlined'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function EmptyBasket() {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center', py: 4, color: 'text.secondary', textAlign: 'center' }}>
      <RemoveShoppingCartOutlinedIcon fontSize="large" />
      <Typography variant="body2">Your basket is empty.</Typography>
      <Typography variant="caption">Add a product to see the total.</Typography>
    </Stack>
  )
}
