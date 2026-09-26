import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useRef } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BasketPanel } from '../components/BasketPanel'
import { MobileBasketBar } from '../components/MobileBasketBar'
import { ProductList } from '../components/ProductList'
import { useBasketItems } from '../hooks/useBasketItems'
import { useBasketTotal } from '../hooks/useBasketTotal'
import { useProducts } from '../hooks/useProducts'
import Alert from '@mui/material/Alert'

export default function BasketPage() {
  const { products, loading: productsLoading, error: productsError } = useProducts() 
  const basket = useBasketItems(products)
  const { summary, loading: totalLoading, error: totalError } = useBasketTotal(basket.items)

  const basketRef = useRef<HTMLDivElement>(null)
  const scrollToBasket = () => basketRef.current?.scrollIntoView({ block: 'start' })

  return (
    <Box sx={{ minHeight: '100vh', pb: { xs: 12, md: 4 } }}>
      <AppHeader itemCount={basket.count} onBasketClick={scrollToBasket} />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.375rem', md: '1.75rem' } }}>
            Widgets
          </Typography>
          <Typography color="text.secondary">Add products to your basket to see the total.</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7, lg: 8 }}>
            {productsError ? (
              <Alert severity="error">Could not load products: {productsError}</Alert>
            ) : (
              <ProductList products={products} loading={productsLoading} onAdd={basket.add} />
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5, lg: 4 }}>
            <Box ref={basketRef} sx={{ position: { md: 'sticky' }, top: { md: 88 }, scrollMarginTop: 72 }}>
              <BasketPanel
                lines={basket.lines}
                summary={summary}
                onAdd={basket.add}
                onRemove={basket.removeOne}
                onClear={basket.clear}
                loading={totalLoading}
                error={totalError} 
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      <MobileBasketBar itemCount={basket.count} total={summary?.total ?? null} onViewBasket={scrollToBasket} />
    </Box>
  )
}
