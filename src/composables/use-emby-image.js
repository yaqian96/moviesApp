import { useUserStore } from '@/stores/user'
import { withTokenQuery } from '@/utils/emby-url'
import { shouldUseLocalApiProxy } from '@/utils/emby-env'

function imageRoot() {
  const user = useUserStore()
  if (shouldUseLocalApiProxy()) {
    return '/api'
  }
  return user.embyApiRoot || ''
}

export function useEmbyImage() {
  function primaryUrl(itemId, tag, maxWidth = 400) {
    const user = useUserStore()
    const root = imageRoot()
    const q = new URLSearchParams()
    if (maxWidth) q.set('maxWidth', String(maxWidth))
    if (tag) q.set('tag', tag)
    const base = `${root}/Items/${itemId}/Images/Primary`
    return withTokenQuery(`${base}?${q.toString()}`, user.activeToken)
  }

  function backdropUrl(itemId, tag, maxWidth = 800, index = 0) {
    const user = useUserStore()
    const root = imageRoot()
    const q = new URLSearchParams()
    if (maxWidth) q.set('maxWidth', String(maxWidth))
    if (tag) q.set('tag', tag)
    const base = `${root}/Items/${itemId}/Images/Backdrop/${index}`
    return withTokenQuery(`${base}?${q.toString()}`, user.activeToken)
  }

  return { primaryUrl, backdropUrl }
}
