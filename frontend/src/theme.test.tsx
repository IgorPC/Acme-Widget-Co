import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Paper from '@mui/material/Paper'
import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { theme } from './theme'

describe('theme', () => {
  it('uses the brand blue as the primary colour', () => {
    expect(theme.palette.primary.main).toBe('#2563eb')
  })

  it('uses a light grey page background', () => {
    expect(theme.palette.background.default).toBe('#f6f7f9')
  })

  it('rounds shapes with a 12px radius', () => {
    expect(theme.shape.borderRadius).toBe(12)
  })

  it('puts Roboto first in the font stack with system fallbacks', () => {
    expect(theme.typography.fontFamily).toMatch(/^Roboto, system-ui/)
    expect(theme.typography.fontFamily).toContain('sans-serif')
  })

  it('customises the h1 and h2 typography', () => {
    expect(theme.typography.h1).toMatchObject({ fontSize: '1.5rem', fontWeight: 700 })
    expect(theme.typography.h2).toMatchObject({ fontSize: '1.125rem', fontWeight: 600 })
  })

  it('disables button elevation and text transform by default', () => {
    expect(theme.components?.MuiButton?.defaultProps).toEqual({ disableElevation: true })
    expect(theme.components?.MuiButton?.styleOverrides).toEqual({
      root: { textTransform: 'none', fontWeight: 600 },
    })
  })

  it('uses outlined cards and papers by default', () => {
    expect(theme.components?.MuiCard?.defaultProps).toEqual({ variant: 'outlined' })
    expect(theme.components?.MuiPaper?.defaultProps).toEqual({ variant: 'outlined' })
  })

  it('applies the defaults to rendered components', () => {
    render(
      <ThemeProvider theme={theme}>
        <Button>Press</Button>
        <Card data-testid="card">Card</Card>
        <Paper data-testid="paper">Paper</Paper>
      </ThemeProvider>,
    )

    expect(screen.getByRole('button', { name: 'Press' })).toHaveClass('MuiButtonBase-root')
    expect(screen.getByTestId('card')).toHaveClass('MuiPaper-outlined')
    expect(screen.getByTestId('paper')).toHaveClass('MuiPaper-outlined')
  })

  it('does not transform button text', () => {
    render(
      <ThemeProvider theme={theme}>
        <Button>Add</Button>
      </ThemeProvider>,
    )

    expect(getComputedStyle(screen.getByRole('button', { name: 'Add' })).textTransform).toBe('none')
  })
})
