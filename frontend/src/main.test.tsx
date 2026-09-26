import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const renderMock = vi.fn()
const createRootMock = vi.fn((_container: Element) => ({ render: renderMock }))

vi.mock('react-dom/client', () => ({
  createRoot: (container: Element) => createRootMock(container),
}))

vi.mock('./pages/BasketPage', () => ({
  default: () => <div data-testid="basket-page-stub" />,
}))

describe('main', () => {
  beforeEach(() => {
    vi.resetModules()
    renderMock.mockReset()
    createRootMock.mockClear()
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const loadMain = async () => {
    await import('./main')
    return renderMock.mock.calls[0][0] as ReactElement<{ children: ReactElement<{ theme: unknown; children: ReactElement[] }> }>
  }

  it('mounts the app into the root element', async () => {
    await loadMain()

    expect(createRootMock).toHaveBeenCalledTimes(1)
    expect(createRootMock).toHaveBeenCalledWith(document.getElementById('root'))
    expect(renderMock).toHaveBeenCalledTimes(1)
  })

  it('wraps the app in StrictMode', async () => {
    const tree = await loadMain()

    expect(tree.type).toBe(StrictMode)
  })

  it('provides the application theme', async () => {
    const tree = await loadMain()
    const { theme } = await import('./theme')
    const provider = tree.props.children

    expect(provider.type).toBe(ThemeProvider)
    expect(provider.props.theme).toBe(theme)
  })

  it('renders the CSS baseline before the page', async () => {
    const tree = await loadMain()
    const [baseline, page] = tree.props.children.props.children

    expect(baseline.type).toBe(CssBaseline)
    expect(page).toBeDefined()
  })

  it('renders the basket page inside the provider', async () => {
    const tree = await loadMain()

    render(tree)

    expect(screen.getByTestId('basket-page-stub')).toBeInTheDocument()
  })
})
