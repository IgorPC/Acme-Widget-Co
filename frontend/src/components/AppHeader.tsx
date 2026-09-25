import AppBar from '@mui/material/AppBar'
import Badge from '@mui/material/Badge'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'

interface Props {
  itemCount: number
  onBasketClick: () => void
}

export function AppHeader({ itemCount, onBasketClick }: Props) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ border: 0, borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <Typography variant="h1" component="span" sx={{ flexGrow: 1, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
            Acme Widget Co
          </Typography>
          <IconButton onClick={onBasketClick} aria-label={`Basket, ${itemCount} items`}>
            <Badge badgeContent={itemCount} color="primary">
              <ShoppingCartOutlinedIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
