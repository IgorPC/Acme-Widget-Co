import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BasketLine } from '../hooks/useBasketItems'
import { BLUE, GREEN, RED } from '../test/fixtures'
import { BasketItems } from './BasketItems'

const lines: BasketLine[] = [
  { product: RED, quantity: 2 },
  { product: GREEN, quantity: 1 },
  { product: BLUE, quantity: 3 },
]

const noop = () => {}

describe('BasketItems', () => {
  it('renders one row per line, in order', () => {
    render(<BasketItems lines={lines} onAdd={noop} onRemove={noop} />)

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Red Widget')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Green Widget')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Blue Widget')).toBeInTheDocument()
  })

  it('renders an empty list when there are no lines', () => {
    render(<BasketItems lines={[]} onAdd={noop} onRemove={noop} />)

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('shows the unit price and the quantity', () => {
    render(<BasketItems lines={lines} onAdd={noop} onRemove={noop} />)

    expect(screen.getByText('$32.95 × 2')).toBeInTheDocument()
    expect(screen.getByText('$24.95 × 1')).toBeInTheDocument()
    expect(screen.getByText('$7.95 × 3')).toBeInTheDocument()
  })

  it('shows the line total', () => {
    render(<BasketItems lines={lines} onAdd={noop} onRemove={noop} />)

    expect(screen.getByText('$65.90')).toBeInTheDocument()
    expect(screen.getAllByText('$24.95')).toHaveLength(1)
    expect(screen.getByText('$23.85')).toBeInTheDocument()
  })

  it('exposes the quantity to assistive technology', () => {
    render(<BasketItems lines={lines} onAdd={noop} onRemove={noop} />)

    expect(screen.getByLabelText('Quantity: 2')).toHaveTextContent('2')
    expect(screen.getByLabelText('Quantity: 1')).toHaveTextContent('1')
    expect(screen.getByLabelText('Quantity: 3')).toHaveTextContent('3')
  })

  it('calls onAdd with the code of the row whose plus button is clicked', async () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    render(<BasketItems lines={lines} onAdd={onAdd} onRemove={onRemove} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add one Green Widget' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith('G01')
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('calls onRemove with the code of the row whose minus button is clicked', async () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    render(<BasketItems lines={lines} onAdd={onAdd} onRemove={onRemove} />)

    await userEvent.click(screen.getByRole('button', { name: 'Remove one Blue Widget' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledWith('B01')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('calls the handlers once per click', async () => {
    const onAdd = vi.fn()
    render(<BasketItems lines={lines} onAdd={onAdd} onRemove={noop} />)
    const button = screen.getByRole('button', { name: 'Add one Red Widget' })

    await userEvent.click(button)
    await userEvent.click(button)

    expect(onAdd).toHaveBeenCalledTimes(2)
  })

  it('renders both controls for every line', () => {
    render(<BasketItems lines={lines} onAdd={noop} onRemove={noop} />)

    expect(screen.getAllByRole('button', { name: /^Add one / })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /^Remove one / })).toHaveLength(3)
  })

  it('handles a single line with a quantity of one', () => {
    render(<BasketItems lines={[{ product: BLUE, quantity: 1 }]} onAdd={noop} onRemove={noop} />)

    expect(screen.getByText('$7.95 × 1')).toBeInTheDocument()
    expect(screen.getAllByText('$7.95')).toHaveLength(1)
  })

  it('handles large quantities', () => {
    render(<BasketItems lines={[{ product: BLUE, quantity: 1000 }]} onAdd={noop} onRemove={noop} />)

    expect(screen.getByText('$7.95 × 1000')).toBeInTheDocument()
    expect(screen.getByText('$7,950.00')).toBeInTheDocument()
  })

  it('renders the product avatar for each row', () => {
    render(<BasketItems lines={lines} onAdd={noop} onRemove={noop} />)

    expect(screen.getAllByTestId('WidgetsOutlinedIcon', { exact: true })).toHaveLength(3)
  })

  it('enables the plus buttons by default', () => {
    render(<BasketItems lines={lines} onAdd={noop} onRemove={noop} />)

    expect(screen.getByRole('button', { name: 'Add one Red Widget' })).toBeEnabled()
  })

  it('disables only the plus buttons when adding is disabled', async () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    render(<BasketItems lines={lines} onAdd={onAdd} onRemove={onRemove} addDisabled />)

    for (const product of [RED, GREEN, BLUE]) {
      expect(screen.getByRole('button', { name: `Add one ${product.name}` })).toBeDisabled()
      expect(screen.getByRole('button', { name: `Remove one ${product.name}` })).toBeEnabled()
    }

    await userEvent.click(screen.getByRole('button', { name: 'Remove one Red Widget' }))

    expect(onRemove).toHaveBeenCalledWith('R01')
    expect(onAdd).not.toHaveBeenCalled()
  })
})
