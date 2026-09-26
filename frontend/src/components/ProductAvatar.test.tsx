import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BLUE, GREEN, RED } from '../test/fixtures'
import { ProductAvatar } from './ProductAvatar'

const renderAvatar = (props: Parameters<typeof ProductAvatar>[0]) => {
  const { container } = render(<ProductAvatar {...props} />)
  return container.firstElementChild as HTMLElement
}

describe('ProductAvatar', () => {
  it('is hidden from assistive technology', () => {
    expect(renderAvatar({ product: RED })).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders the widget icon', () => {
    const { getByTestId } = render(<ProductAvatar product={RED} />)

    expect(getByTestId('WidgetsOutlinedIcon')).toBeInTheDocument()
  })

  it.each([
    [RED, 'rgb(220, 38, 38)'],
    [GREEN, 'rgb(22, 163, 74)'],
    [BLUE, 'rgb(37, 99, 235)'],
    [{ code: 'X01', name: 'Other', price: 1 }, 'rgb(107, 114, 128)'],
    [{ code: 'r01', name: 'Lowercase', price: 1 }, 'rgb(107, 114, 128)'],
    [{ code: '', name: 'Empty', price: 1 }, 'rgb(107, 114, 128)'],
  ])('colours the avatar of %o with %s', (product, color) => {
    expect(getComputedStyle(renderAvatar({ product }))).toHaveProperty('color', color)
  })

  it('uses the first letter of the code to pick the colour', () => {
    const avatar = renderAvatar({ product: { code: 'R99', name: 'Another Red', price: 1 } })

    expect(getComputedStyle(avatar)).toHaveProperty('color', 'rgb(220, 38, 38)')
  })

  it('defaults to a 40px square', () => {
    const style = getComputedStyle(renderAvatar({ product: RED }))

    expect(style.width).toBe('40px')
    expect(style.height).toBe('40px')
  })

  it('honours a custom size', () => {
    const style = getComputedStyle(renderAvatar({ product: RED, size: 64 }))

    expect(style.width).toBe('64px')
    expect(style.height).toBe('64px')
  })

  it('uses a small icon up to 40px', () => {
    const { getByTestId, rerender } = render(<ProductAvatar product={RED} size={36} />)
    expect(getByTestId('WidgetsOutlinedIcon')).toHaveClass('MuiSvgIcon-fontSizeSmall')

    rerender(<ProductAvatar product={RED} size={40} />)
    expect(getByTestId('WidgetsOutlinedIcon')).toHaveClass('MuiSvgIcon-fontSizeSmall')
  })

  it('uses a medium icon above 40px', () => {
    const { getByTestId } = render(<ProductAvatar product={RED} size={48} />)

    expect(getByTestId('WidgetsOutlinedIcon')).toHaveClass('MuiSvgIcon-fontSizeMedium')
  })

  it('renders a rounded avatar', () => {
    expect(renderAvatar({ product: RED })).toHaveClass('MuiAvatar-rounded')
  })
})
