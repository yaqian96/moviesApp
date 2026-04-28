import { embyClient } from './emby-client'
import { useUserStore } from '@/stores/user'
import { withTokenQuery } from '@/utils/emby-url'

// 判断是否在 H5 开发环境
function isDevH5() {
  return typeof window !== 'undefined' && import.meta.env?.DEV
}

function uid() {
  return useUserStore().userId
}

function token() {
  return useUserStore().activeToken
}

function apiRoot() {
  if (isDevH5()) {
    return '/api' // 开发环境使用代理
  }
  return useUserStore().embyApiRoot
}

export async function getPlaybackInfo(itemId) {
  const res = await embyClient.post(
    `/Items/${itemId}/PlaybackInfo`,
    {
      UserId: uid(),
    },
    { params: { UserId: uid() } }
  )
  return res.data
}

function pickMediaSource(data) {
  const srcs = data?.MediaSources || data?.mediaSources
  if (!srcs?.length) return null
  return srcs[0]
}

export function buildStreamUrl(itemId, playbackData) {
  const ms = pickMediaSource(playbackData)
  if (!ms) return ''
  const playSessionId = playbackData.PlaySessionId || playbackData.playSessionId || ''
  const mediaSourceId = ms.Id
  const params = new URLSearchParams()
  if (mediaSourceId) params.set('MediaSourceId', mediaSourceId)
  if (playSessionId) params.set('PlaySessionId', playSessionId)
  params.set('Static', 'true')
  const path = `${apiRoot()}/Videos/${itemId}/stream.mp4?${params.toString()}`
  return withTokenQuery(path, token())
}

export function buildHlsUrl(itemId, playbackData) {
  const ms = pickMediaSource(playbackData)
  if (!ms) return ''
  const playSessionId = playbackData.PlaySessionId || ''
  const mediaSourceId = ms.Id
  const params = new URLSearchParams()
  if (mediaSourceId) params.set('MediaSourceId', mediaSourceId)
  if (playSessionId) params.set('PlaySessionId', playSessionId)
  const path = `${apiRoot()}/Videos/${itemId}/master.m3u8?${params.toString()}`
  return withTokenQuery(path, token())
}

export function buildDirectUrl(itemId, mediaSourceId) {
  if (!mediaSourceId) return ''
  const root = apiRoot()
  const path = `${root}/Items/${itemId}/Download?api_key=${token()}`
  return path
}