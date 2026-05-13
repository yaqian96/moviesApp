export function normalizeEmbyApiRoot(baseUrl) {
  const u = (baseUrl || '').trim().replace(/\/$/, '')
  if (!u) return ''
  if (u.toLowerCase().endsWith('/emby')) return u
  return `${u}/emby`
}

export function withTokenQuery(url, token) {
  if (!url || !token) return url
  if (/[?&]api_key=/i.test(url)) return url
  const join = url.includes('?') ? '&' : '?'
  return `${url}${join}api_key=${encodeURIComponent(token)}`
}

