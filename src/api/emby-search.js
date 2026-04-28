import { embyClient } from './emby-client'
import { useUserStore } from '@/stores/user'

export function searchHints(searchTerm, limit = 50) {
  const userId = useUserStore().userId
  return embyClient.get('/Search/Hints', {
    params: {
      SearchTerm: searchTerm,
      UserId: userId,
      Limit: limit,
    },
  })
}
