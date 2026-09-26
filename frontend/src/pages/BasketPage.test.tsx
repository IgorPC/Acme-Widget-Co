import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateBasket, getProducts } from '../lib/api'
import { CATALOGUE, RED, summaryFor } from '../test/fixtures'
import { createDeferred } from '../test/utils'
import type { BasketData, Product } from '../types'
import BasketPage from './BasketPage'

vi.mock('../lib/api', () => ({
  getProducts: vi.fn(),
  calculateBasket: vi.fn(),
}))

const mockedGetProducts = vi.mocked(getProducts)
const mockedCalculate = vi.mocked(calculateBasket)

const totalOf = (items: string[]): BasketData => {
  const prices: Record<string, number> = { R01: 3295, G01: 2495, B01: 795 }
  const subtotal = items.reduce((sum, code) => sum + prices[code], 0)
  return { items, subtotal, discount: 0, delivery: 495, total: subtotal + 495 }
}

describe('BasketPage', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    mockedGetProducts.mockReset()
    mockedCalculate.mockReset()
    scrollIntoView.mockReset()
    Element.prototype.scrollIntoView = scrollIntoView
    mockedGetProducts.mockResolvedValue(CATALOGUE)
    mockedCalculate.mockImplementation(async (items) => ({
      items,
      subtotal: 6590,
      discount: 1648,
      delivery: 495,
      total: 5437,
    }))
  })

  it('renders the page chrome', async () => {
    render(<BasketPage />)

    expect(screen.getByText('Acme Widget Co')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Widgets' })).toBeInTheDocument()
    expect(screen.getByText('Add products to your basket to see the total.')).toBeInTheDocument()
    await screen.findByText('Red Widget')
  })

  it('shows placeholders while the products load', () => {
    mockedGetProducts.mockImplementation(() => new Promise(() => {}))

    const { container } = render(<BasketPage />)

    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
  })

  it('shows the products once they load', async () => {
    render(<BasketPage />)

    expect(await screen.findByText('Red Widget')).toBeInTheDocument()
    expect(screen.getByText('Green Widget')).toBeInTheDocument()
    expect(screen.getByText('Blue Widget')).toBeInTheDocument()
    expect(screen.getByText('$32.95')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(3)
  })

  it('starts with an empty basket and a zero total without calling the API', async () => {
    render(<BasketPage />)
    await screen.findByText('Red Widget')

    expect(screen.getByText('Your basket is empty.')).toBeInTheDocument()
    expect(screen.getByTestId('basket-total')).toHaveTextContent('$0.00')
    expect(screen.queryByRole('button', { name: 'View basket' })).not.toBeInTheDocument()
    expect(mockedCalculate).not.toHaveBeenCalled()
  })

  it('sends the basket to the API and shows the total it returns', async () => {
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await userEvent.click(addRed)

    expect(await screen.findByText('$54.37', { selector: '[data-testid="basket-total"]' })).toBeInTheDocument()
    expect(mockedCalculate).toHaveBeenLastCalledWith(['R01', 'R01'])
  })

  it('shows the price breakdown returned by the API and does not compute it locally', async () => {
    mockedCalculate.mockResolvedValue({ items: ['R01'], subtotal: 111, discount: 22, delivery: 33, total: 4444 })
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)

    expect(await screen.findByText('$44.44', { selector: '[data-testid="basket-total"]' })).toBeInTheDocument()
    expect(screen.getByText('−$0.22')).toBeInTheDocument()
    expect(screen.getByText('$0.33')).toBeInTheDocument()
  })

  it('sends the codes in the order they were added', async () => {
    render(<BasketPage />)

    const [addRed, addGreen, addBlue] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addBlue)
    await userEvent.click(addRed)
    await userEvent.click(addGreen)
    await userEvent.click(addBlue)

    await screen.findByTestId('basket-total')
    expect(mockedCalculate).toHaveBeenLastCalledWith(['B01', 'R01', 'G01', 'B01'])
  })

  it('lists the basket lines with quantities', async () => {
    render(<BasketPage />)

    const [addRed, , addBlue] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await userEvent.click(addBlue)
    await userEvent.click(addBlue)

    const basket = screen.getByRole('region', { name: 'Basket' })
    expect(within(basket).getByText('$32.95 × 1')).toBeInTheDocument()
    expect(within(basket).getByText('$7.95 × 2')).toBeInTheDocument()
    await screen.findByTestId('basket-total')
  })

  it('shows a placeholder for the total while the API call is pending', async () => {
    const pending = createDeferred<BasketData>()
    mockedCalculate.mockImplementation(() => pending.promise)
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)

    expect(screen.queryByTestId('basket-total')).not.toBeInTheDocument()

    await act(async () => pending.resolve(totalOf(['R01'])))

    expect(screen.getByTestId('basket-total')).toHaveTextContent('$37.90')
  })

  it('increments and decrements from the basket rows', async () => {
    mockedCalculate.mockImplementation(async (items) => totalOf(items))
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await userEvent.click(await screen.findByRole('button', { name: 'Add one Red Widget' }))

    expect(await screen.findByText('$70.85', { selector: '[data-testid="basket-total"]' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Remove one Red Widget' }))

    expect(await screen.findByText('$37.90', { selector: '[data-testid="basket-total"]' })).toBeInTheDocument()
    expect(mockedCalculate).toHaveBeenLastCalledWith(['R01'])
  })

  it('removes the line and resets the total when the last unit is removed', async () => {
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await screen.findByTestId('basket-total')
    const callsBefore = mockedCalculate.mock.calls.length

    await userEvent.click(screen.getByRole('button', { name: 'Remove one Red Widget' }))

    expect(screen.getByText('Your basket is empty.')).toBeInTheDocument()
    expect(screen.getByTestId('basket-total')).toHaveTextContent('$0.00')
    expect(mockedCalculate).toHaveBeenCalledTimes(callsBefore)
  })

  it('clears the basket without calling the API again', async () => {
    render(<BasketPage />)

    const [addRed, addGreen] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await userEvent.click(addGreen)
    await screen.findByTestId('basket-total')
    const callsBefore = mockedCalculate.mock.calls.length

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(screen.getByText('Your basket is empty.')).toBeInTheDocument()
    expect(screen.getByTestId('basket-total')).toHaveTextContent('$0.00')
    expect(mockedCalculate).toHaveBeenCalledTimes(callsBefore)
  })

  it('updates the badge in the header', async () => {
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    expect(screen.getByRole('button', { name: 'Basket, 0 items' })).toBeInTheDocument()

    await userEvent.click(addRed)
    await userEvent.click(addRed)

    expect(screen.getByRole('button', { name: 'Basket, 2 items' })).toBeInTheDocument()
    await screen.findByTestId('basket-total')
  })

  it('shows the mobile basket bar with the total once the basket has items', async () => {
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)

    expect(screen.getByText('1 item')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'View basket' })).toBeInTheDocument()
    expect((await screen.findAllByText('$54.37')).length).toBeGreaterThanOrEqual(2)
  })

  it('shows a dash in the mobile bar while the total is loading', async () => {
    mockedCalculate.mockImplementation(() => new Promise(() => {}))
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)

    expect(screen.getByText('—', { selector: 'h6' })).toBeInTheDocument()
  })

  it('scrolls to the basket when the header button is clicked', async () => {
    render(<BasketPage />)
    await screen.findByText('Red Widget')

    await userEvent.click(screen.getByRole('button', { name: 'Basket, 0 items' }))

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
  })

  it('scrolls to the basket when View basket is clicked', async () => {
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await userEvent.click(await screen.findByRole('button', { name: 'View basket' }))

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    await screen.findByTestId('basket-total')
  })

  it('shows an error when the products cannot be loaded', async () => {
    mockedGetProducts.mockImplementation(async () => {
      throw new Error('offline')
    })

    render(<BasketPage />)

    expect(await screen.findByText('Could not load products: offline')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
  })

  it('shows an error when the total cannot be calculated', async () => {
    mockedCalculate.mockImplementation(async () => {
      throw new Error('server exploded')
    })
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)

    expect(await screen.findByText('Could not calculate the total: server exploded')).toBeInTheDocument()
    expect(screen.queryByTestId('basket-total')).not.toBeInTheDocument()
  })

  it('recovers from a calculation error when the basket changes', async () => {
    mockedCalculate
      .mockImplementationOnce(async () => {
        throw new Error('flaky')
      })
      .mockImplementation(async (items) => totalOf(items))
    render(<BasketPage />)

    const [addRed, addGreen] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await screen.findByText('Could not calculate the total: flaky')

    await userEvent.click(addGreen)

    expect(await screen.findByText('$62.85', { selector: '[data-testid="basket-total"]' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('ignores a stale response when the basket changes while a request is in flight', async () => {
    const first = createDeferred<BasketData>()
    mockedCalculate
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(async (items) => summaryFor(items, 200))
    render(<BasketPage />)

    const [addRed, addGreen] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await userEvent.click(addGreen)

    expect(await screen.findByText('$2.00', { selector: '[data-testid="basket-total"]' })).toBeInTheDocument()

    await act(async () => first.resolve(summaryFor(['R01'], 100)))

    expect(screen.getByTestId('basket-total')).toHaveTextContent('$2.00')
  })

  it('handles an empty catalogue', async () => {
    mockedGetProducts.mockResolvedValue([])
    render(<BasketPage />)

    expect(await screen.findByText('Your basket is empty.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('renders products whose price is zero', async () => {
    const free: Product = { code: 'F01', name: 'Free Widget', price: 0 }
    mockedGetProducts.mockResolvedValue([free, RED])
    render(<BasketPage />)

    const freeCard = (await screen.findByText('Free Widget')).closest('li') as HTMLElement
    expect(within(freeCard).getByText('$0.00')).toBeInTheDocument()
  })

  it('stops adding at 100 items and explains why, even under rapid clicking', async () => {
    mockedCalculate.mockImplementation(async (items) => summaryFor(items, items.length * 795))
    render(<BasketPage />)

    const [, , addBlue] = await screen.findAllByRole('button', { name: 'Add' })
    for (let i = 0; i < 105; i++) act(() => addBlue.click())

    expect(await screen.findByText('Your basket is full. The maximum is 100 items.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Basket, 100 items' })).toBeInTheDocument()
    for (const button of screen.getAllByRole('button', { name: 'Add' })) expect(button).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add one Blue Widget' })).toBeDisabled()
    expect(mockedCalculate.mock.calls.every(([items]) => items.length <= 100)).toBe(true)
  })

  it('allows adding again after removing one from a full basket', async () => {
    mockedCalculate.mockImplementation(async (items) => summaryFor(items, items.length * 795))
    render(<BasketPage />)

    const [, , addBlue] = await screen.findAllByRole('button', { name: 'Add' })
    for (let i = 0; i < 100; i++) act(() => addBlue.click())
    await screen.findByText('Your basket is full. The maximum is 100 items.')

    await userEvent.click(screen.getByRole('button', { name: 'Remove one Blue Widget' }))

    expect(screen.queryByText('Your basket is full. The maximum is 100 items.')).not.toBeInTheDocument()
    expect(addBlue).toBeEnabled()
  })

  it('loads the products again when Try again is clicked', async () => {
    mockedGetProducts
      .mockImplementationOnce(async () => {
        throw new Error('offline')
      })
      .mockResolvedValueOnce(CATALOGUE)
    render(<BasketPage />)

    await screen.findByText('Could not load products: offline')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Red Widget')).toBeInTheDocument()
    expect(screen.queryByText('Could not load products: offline')).not.toBeInTheDocument()
    expect(mockedGetProducts).toHaveBeenCalledTimes(2)
  })

  it('calculates the total again when Try again is clicked', async () => {
    mockedCalculate
      .mockImplementationOnce(async () => {
        throw new Error('flaky')
      })
      .mockImplementation(async (items) => totalOf(items))
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)
    await screen.findByText('Could not calculate the total: flaky')

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('$37.90', { selector: '[data-testid="basket-total"]' })).toBeInTheDocument()
    expect(mockedCalculate).toHaveBeenCalledTimes(2)
    expect(mockedCalculate).toHaveBeenLastCalledWith(['R01'])
  })

  it('explains the delivery charge when the offer lowers the amount below a tier', async () => {
    mockedCalculate.mockResolvedValue({
      items: ['R01', 'R01', 'G01', 'B01'],
      subtotal: 9880,
      discount: 1648,
      delivery: 295,
      total: 8527,
    })
    render(<BasketPage />)

    const [addRed] = await screen.findAllByRole('button', { name: 'Add' })
    await userEvent.click(addRed)

    expect(await screen.findByTestId('delivery-basis')).toHaveTextContent('Delivery is based on $82.32')
  })
})
