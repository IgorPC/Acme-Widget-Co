/**
 * Thin fetch wrapper for the Laravel API.
 * Paths are relative (e.g. "/api/..."), the Vite dev server proxies them
 * to the backend (see vite.config.ts).
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

/** Pings Laravel's built-in health endpoint through the proxy. */
export async function isBackendUp(): Promise<boolean> {
  try {
    const response = await fetch('/up')
    return response.ok
  } catch {
    return false
  }
}
