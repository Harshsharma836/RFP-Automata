// API helper: uses Vite env var VITE_API_BASE if set, otherwise defaults to localhost:4000
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:4000'

export async function apiFetch(path, options = {}) {
  // allow passing either absolute URL or path starting with /api
  const url = path.match(/^https?:\/\//) ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`

  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`API request failed: ${res.status} ${res.statusText} - ${text}`)
    err.status = res.status
    throw err
  }
  return res
}

export default apiFetch
