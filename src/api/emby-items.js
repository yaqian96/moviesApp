import { embyClient } from './emby-client'
import { useUserStore } from '@/stores/user'

function uid() {
  return useUserStore().userId
}

export function fetchUserViews() {
  return embyClient.get(`/Users/${uid()}/Views`)
}

export function fetchResumeItems(limit = 24) {
  return embyClient.get(`/Users/${uid()}/Items/Resume`, {
    params: {
      Limit: limit,
      Recursive: true,
      IncludeItemTypes: 'Movie,Episode',
      Fields: 'PrimaryImageAspectRatio,Overview,Path,Type,MediaType,UserData,SeriesName,SeasonName,IndexNumber,ParentIndexNumber,BackdropImageTags',
    },
  })
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
