import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MobileBasketBar } from './MobileBasketBar'

describe('MobileBasketBar', () => {
  it('renders nothing when the basket is empty', () => {
    const { container } = render(<MobileBasketBar itemCount={0} total={0} onViewBasket={() => {}} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for an empty basket even without a total', () => {
    const { container } = render(<MobileBasketBar itemCount={0} total={null} onViewBasket={() => {}} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('uses the singular for one item', () => {
    render(<MobileBasketBar itemCount={1} total={795} onViewBasket={() => {}} />)

    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it.each([2, 3, 10, 100])('uses the plural for %i items', (count) => {
    render(<MobileBasketBar itemCount={count} total={795} onViewBasket={() => {}} />)

    expect(screen.getByText(`${count} items`)).toBeInTheDocument()
  })

  it('shows the formatted total', () => {
    render(<MobileBasketBar itemCount={2} total={5437} onViewBasket={() => {}} />)

    expect(screen.getByText('$54.37')).toBeInTheDocument()
  })

  it('shows a dash while the total is unknown', () => {
    render(<MobileBasketBar itemCount={2} total={null} onViewBasket={() => {}} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows a zero total rather than a dash', () => {
    render(<MobileBasketBar itemCount={1} total={0} onViewBasket={() => {}} />)

    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('calls onViewBasket when the button is clicked', async () => {
    const onViewBasket = vi.fn()
    render(<MobileBasketBar itemCount={2} total={5437} onViewBasket={onViewBasket} />)

    await userEvent.click(screen.getByRole('button', { name: 'View basket' }))

    expect(onViewBasket).toHaveBeenCalledTimes(1)
  })

  it('appears once the basket gets its first item', () => {
    const { container, rerender } = render(<MobileBasketBar itemCount={0} total={0} onViewBasket={() => {}} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<MobileBasketBar itemCount={1} total={795} onViewBasket={() => {}} />)

    expect(screen.getByRole('button', { name: 'View basket' })).toBeInTheDocument()
  })
})
