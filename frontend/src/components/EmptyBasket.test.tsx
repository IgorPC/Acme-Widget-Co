import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyBasket } from './EmptyBasket'

describe('EmptyBasket', () => {
  it('tells the user the basket is empty', () => {
    render(<EmptyBasket />)

    expect(screen.getByText('Your basket is empty.')).toBeInTheDocument()
  })

  it('hints at what to do next', () => {
    render(<EmptyBasket />)

    expect(screen.getByText('Add a product to see the total.')).toBeInTheDocument()
  })

  it('renders the empty cart icon', () => {
    render(<EmptyBasket />)

    expect(screen.getByTestId('RemoveShoppingCartOutlinedIcon')).toBeInTheDocument()
  })

  it('renders no interactive controls', () => {
    render(<EmptyBasket />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
