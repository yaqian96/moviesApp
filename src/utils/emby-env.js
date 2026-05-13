export function shouldUseLocalApiProxy() {
  if (typeof window === 'undefined') return false
  if (import.meta.env.DEV) return true
  if (import.meta.env.PROD && window.location.protocol !== 'file:') {
    const h = window.location.hostname
    return h === 'localhost' || h === '127.0.0.1'
  }
  return false
}
