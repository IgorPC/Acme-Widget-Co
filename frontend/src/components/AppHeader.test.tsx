import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('shows the store name', () => {
    render(<AppHeader itemCount={0} onBasketClick={() => {}} />)

    expect(screen.getByText('Acme Widget Co')).toBeInTheDocument()
  })

  it('describes the basket item count to assistive technology', () => {
    render(<AppHeader itemCount={3} onBasketClick={() => {}} />)

    expect(screen.getByRole('button', { name: 'Basket, 3 items' })).toBeInTheDocument()
  })

  it('describes an empty basket', () => {
    render(<AppHeader itemCount={0} onBasketClick={() => {}} />)

    expect(screen.getByRole('button', { name: 'Basket, 0 items' })).toBeInTheDocument()
  })

  it('shows the item count in the badge', () => {
    render(<AppHeader itemCount={7} onBasketClick={() => {}} />)

    expect(screen.getByText('7')).toBeVisible()
  })

  it('hides the badge when the basket is empty', () => {
    const { container } = render(<AppHeader itemCount={0} onBasketClick={() => {}} />)

    expect(container.querySelector('.MuiBadge-badge')).toHaveClass('MuiBadge-invisible')
  })

  it('shows the badge when the basket has items', () => {
    const { container } = render(<AppHeader itemCount={1} onBasketClick={() => {}} />)

    expect(container.querySelector('.MuiBadge-badge')).not.toHaveClass('MuiBadge-invisible')
  })

  it('caps very large counts', () => {
    render(<AppHeader itemCount={150} onBasketClick={() => {}} />)

    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('calls onBasketClick when the basket button is clicked', async () => {
    const onBasketClick = vi.fn()
    render(<AppHeader itemCount={2} onBasketClick={onBasketClick} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onBasketClick).toHaveBeenCalledTimes(1)
  })

  it('is operable with the keyboard', async () => {
    const onBasketClick = vi.fn()
    render(<AppHeader itemCount={2} onBasketClick={onBasketClick} />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(onBasketClick).toHaveBeenCalledTimes(1)
  })

  it('updates the label when the count changes', () => {
    const { rerender } = render(<AppHeader itemCount={1} onBasketClick={() => {}} />)
    rerender(<AppHeader itemCount={5} onBasketClick={() => {}} />)

    expect(screen.getByRole('button', { name: 'Basket, 5 items' })).toBeInTheDocument()
  })
})
