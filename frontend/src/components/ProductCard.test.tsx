import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BLUE, RED } from '../test/fixtures'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  it('shows the name, the code and the formatted price', () => {
    render(<ProductCard product={RED} onAdd={() => {}} />)

    expect(screen.getByText('Red Widget')).toBeInTheDocument()
    expect(screen.getByText('R01')).toBeInTheDocument()
    expect(screen.getByText('$32.95')).toBeInTheDocument()
  })

  it('renders the name as a level 3 heading', () => {
    render(<ProductCard product={RED} onAdd={() => {}} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Red Widget' })).toBeInTheDocument()
  })

  it('calls onAdd with the product code', async () => {
    const onAdd = vi.fn()
    render(<ProductCard product={RED} onAdd={onAdd} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith('R01')
  })

  it('calls onAdd once per click', async () => {
    const onAdd = vi.fn()
    render(<ProductCard product={BLUE} onAdd={onAdd} />)
    const button = screen.getByRole('button', { name: 'Add' })

    await userEvent.click(button)
    await userEvent.click(button)
    await userEvent.click(button)

    expect(onAdd).toHaveBeenCalledTimes(3)
    expect(onAdd).toHaveBeenNthCalledWith(3, 'B01')
  })

  it('does not call onAdd until the button is clicked', () => {
    const onAdd = vi.fn()
    render(<ProductCard product={RED} onAdd={onAdd} />)

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('can be activated with the keyboard', async () => {
    const onAdd = vi.fn()
    render(<ProductCard product={RED} onAdd={onAdd} />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(onAdd).toHaveBeenCalledWith('R01')
  })

  it('renders a zero price', () => {
    render(<ProductCard product={{ code: 'F01', name: 'Free Widget', price: 0 }} onAdd={() => {}} />)

    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('renders a very long name without dropping it', () => {
    const name = 'Extraordinarily Long Widget Name '.repeat(10).trim()
    render(<ProductCard product={{ ...RED, name }} onAdd={() => {}} />)

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(name)
  })

  it('renders different products independently', () => {
    const { rerender } = render(<ProductCard product={RED} onAdd={() => {}} />)
    rerender(<ProductCard product={BLUE} onAdd={() => {}} />)

    expect(screen.queryByText('Red Widget')).not.toBeInTheDocument()
    expect(screen.getByText('Blue Widget')).toBeInTheDocument()
    expect(screen.getByText('$7.95')).toBeInTheDocument()
  })

  it('is enabled by default', () => {
    render(<ProductCard product={RED} onAdd={() => {}} />)

    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()
  })

  it('disables the Add button and ignores clicks when disabled', () => {
    const onAdd = vi.fn()
    render(<ProductCard product={RED} onAdd={onAdd} disabled />)

    const button = screen.getByRole('button', { name: 'Add' })
    expect(button).toBeDisabled()

    button.click()

    expect(onAdd).not.toHaveBeenCalled()
  })
})
