import { embyClient } from './emby-client'
import { useUserStore } from '@/stores/user'

function uid() {
  return useUserStore().userId
}

export function fetchUserViews() {
  return embyClient.get(`/Users/${uid()}/Views`)
}

export async function fetchResumeItems(limit = 24) {
  const params = {
    Limit: limit,
    Recursive: true,
    Fields:
      'PrimaryImageAspectRatio,Overview,Path,Type,MediaType,UserData,ImageTags,BackdropImageTags',
  }
  try {
    return await embyClient.get(`/Users/${uid()}/Items/Resume`, { params })
  } catch {
    return embyClient.get(`/Users/${uid()}/Items`, {
      params: {
        ...params,
        SortBy: 'DatePlayed',
        SortOrder: 'Descending',
        Filters: 'IsResumable',
      },
    })
  }
}

export function fetchUserItems(params) {
  return embyClient.get(`/Users/${uid()}/Items`, {
    params: {
      Fields: 'PrimaryImageAspectRatio,Overview,Type,MediaType,RunTimeTicks,ParentId,SeriesName',
      ...params,
    },
  })
}

export function buildUserItemsParams(optionalParentId, rest) {
  const out = { ...rest }
  if (optionalParentId) {
    out.ParentId = optionalParentId
  }
  return out
}

export function fetchItemById(itemId) {
  return embyClient.get(`/Users/${uid()}/Items/${itemId}`, {
    params: {
      Fields:
        'PrimaryImageAspectRatio,Overview,Type,MediaType,RunTimeTicks,Path,MediaSources,ParentId,SeriesName,SeasonName,IndexNumber,ParentIndexNumber,SeriesId,SeasonId,UserData,Genres,People,Studios,ProductionYear',
    },
  })
}
