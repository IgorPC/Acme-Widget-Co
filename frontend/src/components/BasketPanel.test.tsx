import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BasketLine } from '../hooks/useBasketItems'
import { BLUE, RED } from '../test/fixtures'
import type { BasketData } from '../types'
import { BasketPanel } from './BasketPanel'

const lines: BasketLine[] = [
  { product: RED, quantity: 2 },
  { product: BLUE, quantity: 1 },
]

const summary: BasketData = { items: ['R01', 'R01', 'B01'], subtotal: 7385, discount: 1648, delivery: 495, total: 6232 }
const emptySummary: BasketData = { items: [], subtotal: 0, discount: 0, delivery: 0, total: 0 }

const noop = () => {}

const handlers = () => ({ onAdd: vi.fn(), onRemove: vi.fn(), onClear: vi.fn() })

describe('BasketPanel', () => {
  it('is a labelled region titled Basket', () => {
    render(<BasketPanel lines={lines} summary={summary} onAdd={noop} onRemove={noop} onClear={noop} />)

    expect(screen.getByRole('region', { name: 'Basket' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Basket' })).toBeInTheDocument()
  })

  it('shows the empty state and no Clear button when there are no lines', () => {
    render(<BasketPanel lines={[]} summary={emptySummary} onAdd={noop} onRemove={noop} onClear={noop} />)

    expect(screen.getByText('Your basket is empty.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('still shows the summary when the basket is empty', () => {
    render(<BasketPanel lines={[]} summary={emptySummary} onAdd={noop} onRemove={noop} onClear={noop} />)

    expect(screen.getByTestId('basket-total')).toHaveTextContent('$0.00')
  })

  it('lists the lines and the Clear button when the basket has items', () => {
    render(<BasketPanel lines={lines} summary={summary} onAdd={noop} onRemove={noop} onClear={noop} />)

    expect(screen.queryByText('Your basket is empty.')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })

  it('shows the summary it receives', () => {
    render(<BasketPanel lines={lines} summary={summary} onAdd={noop} onRemove={noop} onClear={noop} />)

    expect(screen.getByTestId('basket-total')).toHaveTextContent('$62.32')
    expect(screen.getByText('−$16.48')).toBeInTheDocument()
  })

  it('calls onClear when Clear is clicked', async () => {
    const { onAdd, onRemove, onClear } = handlers()
    render(<BasketPanel lines={lines} summary={summary} onAdd={onAdd} onRemove={onRemove} onClear={onClear} />)

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onAdd).not.toHaveBeenCalled()
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('wires the row buttons to onAdd and onRemove', async () => {
    const { onAdd, onRemove, onClear } = handlers()
    render(<BasketPanel lines={lines} summary={summary} onAdd={onAdd} onRemove={onRemove} onClear={onClear} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add one Red Widget' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove one Blue Widget' }))

    expect(onAdd).toHaveBeenCalledWith('R01')
    expect(onRemove).toHaveBeenCalledWith('B01')
    expect(onClear).not.toHaveBeenCalled()
  })

  it('shows placeholders while the total is loading', () => {
    render(<BasketPanel lines={lines} summary={null} loading onAdd={noop} onRemove={noop} onClear={noop} />)

    expect(screen.queryByTestId('basket-total')).not.toBeInTheDocument()
  })

  it('shows the error and keeps the lines visible', () => {
    render(<BasketPanel lines={lines} summary={null} error="offline" onAdd={noop} onRemove={noop} onClear={noop} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Could not calculate the total: offline')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })

  it('switches between the empty state and the list as lines change', () => {
    const { rerender } = render(
      <BasketPanel lines={[]} summary={emptySummary} onAdd={noop} onRemove={noop} onClear={noop} />,
    )
    expect(screen.getByText('Your basket is empty.')).toBeInTheDocument()

    rerender(<BasketPanel lines={lines} summary={summary} onAdd={noop} onRemove={noop} onClear={noop} />)

    expect(screen.queryByText('Your basket is empty.')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
