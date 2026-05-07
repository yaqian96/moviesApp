import { useUserStore } from '@/stores/user'
import { withTokenQuery } from '@/utils/emby-url'
import { shouldUseLocalApiProxy } from '@/utils/emby-env'

export function useEmbyImage() {
  function getBaseUrl() {
    const user = useUserStore()
    if (shouldUseLocalApiProxy()) {
      return '/api'
    }
    return user.embyApiRoot
  }

  function primaryUrl(itemId, tag, maxWidth = 400) {
    const base = `${getBaseUrl()}/Items/${itemId}/Images/Primary`
    const q = new URLSearchParams()
    if (maxWidth) q.set('maxWidth', String(maxWidth))
    if (tag) q.set('tag', tag)
    return withTokenQuery(`${base}?${q.toString()}`, useUserStore().activeToken)
  }

  function backdropUrl(itemId, tag, maxWidth = 800, index = 0) {
    const base = `${getBaseUrl()}/Items/${itemId}/Images/Backdrop/${index}`
    const q = new URLSearchParams()
    if (maxWidth) q.set('maxWidth', String(maxWidth))
    if (tag) q.set('tag', tag)
    return withTokenQuery(`${base}?${q.toString()}`, useUserStore().activeToken)
  }

  return { primaryUrl, backdropUrl }
}