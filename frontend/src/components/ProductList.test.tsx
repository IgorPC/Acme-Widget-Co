import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CATALOGUE, GREEN } from '../test/fixtures'
import { ProductList } from './ProductList'

describe('ProductList', () => {
  it('renders one card per product, in order', () => {
    render(<ProductList products={CATALOGUE} onAdd={() => {}} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(within(items[0]).getByText('Red Widget')).toBeInTheDocument()
    expect(within(items[1]).getByText('Green Widget')).toBeInTheDocument()
    expect(within(items[2]).getByText('Blue Widget')).toBeInTheDocument()
  })

  it('renders an empty list when there are no products', () => {
    render(<ProductList products={[]} onAdd={() => {}} />)

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('renders a single product', () => {
    render(<ProductList products={[GREEN]} onAdd={() => {}} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('$24.95')).toBeInTheDocument()
  })

  it('calls onAdd with the code of the clicked product', async () => {
    const onAdd = vi.fn()
    render(<ProductList products={CATALOGUE} onAdd={onAdd} />)

    const buttons = screen.getAllByRole('button', { name: 'Add' })
    await userEvent.click(buttons[1])
    await userEvent.click(buttons[2])

    expect(onAdd).toHaveBeenCalledTimes(2)
    expect(onAdd).toHaveBeenNthCalledWith(1, 'G01')
    expect(onAdd).toHaveBeenNthCalledWith(2, 'B01')
  })

  it('renders skeleton placeholders while loading', () => {
    const { container } = render(<ProductList products={[]} loading onAdd={() => {}} />)

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(3)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows skeletons instead of products while loading', () => {
    render(<ProductList products={CATALOGUE} loading onAdd={() => {}} />)

    expect(screen.queryByText('Red Widget')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('does not show skeletons when not loading', () => {
    const { container } = render(<ProductList products={CATALOGUE} loading={false} onAdd={() => {}} />)

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0)
  })

  it('defaults to not loading', () => {
    const { container } = render(<ProductList products={CATALOGUE} onAdd={() => {}} />)

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('swaps skeletons for products when loading finishes', () => {
    const { container, rerender } = render(<ProductList products={[]} loading onAdd={() => {}} />)
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(3)

    rerender(<ProductList products={CATALOGUE} loading={false} onAdd={() => {}} />)

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
