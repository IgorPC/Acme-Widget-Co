import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BasketData } from '../types'
import { BasketSummary } from './BasketSummary'

const full: BasketData = { items: ['R01', 'R01'], subtotal: 6590, discount: 1648, delivery: 495, total: 5437 }

describe('BasketSummary', () => {
  it('shows how the total was reached', () => {
    render(<BasketSummary summary={full} />)

    expect(screen.getByText('$65.90')).toBeInTheDocument()
    expect(screen.getByText('−$16.48')).toBeInTheDocument()
    expect(screen.getByText('$4.95')).toBeInTheDocument()
    expect(screen.getByTestId('basket-total')).toHaveTextContent('$54.37')
  })

  it('labels every row', () => {
    render(<BasketSummary summary={full} />)

    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('Offer discount')).toBeInTheDocument()
    expect(screen.getByText('Delivery')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('hides the discount row when there is no discount', () => {
    render(<BasketSummary summary={{ items: ['B01'], subtotal: 795, discount: 0, delivery: 495, total: 1290 }} />)

    expect(screen.queryByText('Offer discount')).not.toBeInTheDocument()
  })

  it('shows the discount row for a discount of one cent', () => {
    render(<BasketSummary summary={{ ...full, discount: 1 }} />)

    expect(screen.getByText('−$0.01')).toBeInTheDocument()
  })

  it('shows free delivery when the delivery charge is zero', () => {
    render(
      <BasketSummary
        summary={{ items: ['B01', 'B01', 'R01', 'R01', 'R01'], subtotal: 11475, discount: 1648, delivery: 0, total: 9827 }}
      />,
    )

    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('does not say free delivery for an empty basket summary', () => {
    render(<BasketSummary summary={{ items: [], subtotal: 0, discount: 0, delivery: 0, total: 0 }} />)

    expect(screen.queryByText('Free')).not.toBeInTheDocument()
    expect(screen.getByTestId('basket-total')).toHaveTextContent('$0.00')
    expect(screen.getAllByText('$0.00')).toHaveLength(3)
  })

  it('shows a paid delivery charge instead of Free', () => {
    render(<BasketSummary summary={full} />)

    expect(screen.queryByText('Free')).not.toBeInTheDocument()
  })

  it('shows dashes when there is no summary yet', () => {
    render(<BasketSummary summary={null} />)

    expect(screen.getAllByText('—')).toHaveLength(3)
    expect(screen.getByTestId('basket-total')).toHaveTextContent('—')
    expect(screen.queryByText('Offer discount')).not.toBeInTheDocument()
    expect(screen.queryByText('Free')).not.toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    const { container } = render(<BasketSummary summary={null} loading />)

    expect(screen.queryByTestId('basket-total')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(4)
    expect(screen.getByText('Offer discount')).toBeInTheDocument()
  })

  it('does not show stale values while loading', () => {
    render(<BasketSummary summary={full} loading />)

    expect(screen.queryByText('$65.90')).not.toBeInTheDocument()
    expect(screen.queryByText('$54.37')).not.toBeInTheDocument()
    expect(screen.queryByTestId('basket-total')).not.toBeInTheDocument()
  })

  it('does not show placeholders when not loading', () => {
    const { container } = render(<BasketSummary summary={full} loading={false} />)

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0)
  })

  it('shows the error instead of the total', () => {
    render(<BasketSummary summary={null} error="offline" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Could not calculate the total: offline')
    expect(screen.queryByTestId('basket-total')).not.toBeInTheDocument()
    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument()
  })

  it('prefers the error over loading and a stale summary', () => {
    render(<BasketSummary summary={full} loading error="boom" />)

    expect(screen.getByRole('alert')).toHaveTextContent('boom')
    expect(screen.queryByTestId('basket-total')).not.toBeInTheDocument()
  })

  it('ignores an empty error string', () => {
    render(<BasketSummary summary={full} error="" />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('basket-total')).toHaveTextContent('$54.37')
  })

  it('ignores a null error', () => {
    render(<BasketSummary summary={full} error={null} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces updates politely to assistive technology', () => {
    const { container } = render(<BasketSummary summary={full} />)

    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })

  it('formats large amounts with thousands separators', () => {
    render(<BasketSummary summary={{ items: [], subtotal: 123456789, discount: 0, delivery: 0, total: 123456789 }} />)

    expect(screen.getAllByText('$1,234,567.89')).toHaveLength(2)
  })

  it('updates when the summary changes', () => {
    const { rerender } = render(<BasketSummary summary={full} />)
    rerender(<BasketSummary summary={{ ...full, total: 100 }} />)

    expect(screen.getByTestId('basket-total')).toHaveTextContent('$1.00')
  })

  it('offers a retry button when the total fails and a retry handler is given', async () => {
    const onRetry = vi.fn()
    render(<BasketSummary summary={null} error="offline" onRetry={onRetry} />)

    await userEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not offer a retry button without a retry handler', () => {
    render(<BasketSummary summary={null} error="offline" />)

    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('explains that delivery is based on the amount after the discount', () => {
    render(<BasketSummary summary={full} />)

    expect(screen.getByTestId('delivery-basis')).toHaveTextContent(
      'Delivery is based on $49.42, the amount after the offer discount.',
    )
  })

  it('explains why a subtotal of $90 or more still pays delivery', () => {
    render(
      <BasketSummary
        summary={{ items: ['R01', 'R01', 'G01', 'B01'], subtotal: 9880, discount: 1648, delivery: 295, total: 8527 }}
      />,
    )

    expect(screen.getByText('$98.80')).toBeInTheDocument()
    expect(screen.getByText('$2.95')).toBeInTheDocument()
    expect(screen.getByTestId('delivery-basis')).toHaveTextContent('Delivery is based on $82.32')
  })

  it('does not explain the delivery basis without a discount', () => {
    render(<BasketSummary summary={{ ...full, discount: 0, total: 7085 }} />)

    expect(screen.queryByTestId('delivery-basis')).not.toBeInTheDocument()
  })

  it('does not explain the delivery basis while loading', () => {
    render(<BasketSummary summary={full} loading />)

    expect(screen.queryByTestId('delivery-basis')).not.toBeInTheDocument()
  })

  it('does not explain the delivery basis without a summary', () => {
    render(<BasketSummary summary={null} />)

    expect(screen.queryByTestId('delivery-basis')).not.toBeInTheDocument()
  })
})
