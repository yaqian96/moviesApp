import { useUserStore } from '@/stores/user'
import { withTokenQuery } from '@/utils/emby-url'

// 判断是否在 H5 开发环境
function isDevH5() {
  return typeof window !== 'undefined' && import.meta.env?.DEV
}

export function useEmbyImage() {
  function getBaseUrl() {
    const user = useUserStore()
    if (isDevH5()) {
      return '/api' // 开发环境使用代理
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