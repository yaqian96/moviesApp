import { embyClient } from './emby-client'
import { useUserStore } from '@/stores/user'
import { withTokenQuery } from '@/utils/emby-url'
import { shouldUseLocalApiProxy } from '@/utils/emby-env'

function uid() {
  return useUserStore().userId
}

function token() {
  return useUserStore().activeToken
}

function apiRoot() {
  if (shouldUseLocalApiProxy()) {
    return '/api'
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

export function newPlaySessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function resolvePlaySessionId(pb) {
  if (!pb || typeof pb !== 'object') return ''
  let sid =
    pb.PlaySessionId ||
    pb.playSessionId ||
    pb.PlaySessionInfo?.PlaySessionId ||
    pb.PlaySessionInfo?.playSessionId ||
    ''
  if (!sid && Array.isArray(pb.MediaSources)) {
    for (const ms of pb.MediaSources) {
      sid = ms?.PlaySessionId || ms?.playSessionId || ''
      if (sid) break
    }
  }
  return typeof sid === 'string' ? sid : ''
}

const TICKS_PER_SEC = 10_000_000

function buildPlaybackBody({
  itemId,
  mediaSourceId,
  playSessionId,
  positionTicks = 0,
  isPaused = false,
  canSeek = true,
}) {
  return {
    ItemId: itemId,
    MediaSourceId: mediaSourceId,
    PlaySessionId: playSessionId,
    PositionTicks: Math.max(0, Math.floor(positionTicks)),
    CanSeek: canSeek,
    IsPaused: isPaused,
    IsMuted: false,
    VolumeLevel: 100,
    PlayMethod: 'DirectPlay',
    QueueableMediaTypes: ['Video'],
  }
}

export function reportPlaybackStarted(ctx) {
  return embyClient.post('/Sessions/Playing', buildPlaybackBody(ctx))
}

export function reportPlaybackProgress(ctx, eventName = 'TimeUpdate') {
  return embyClient.post('/Sessions/Playing/Progress', {
    ...buildPlaybackBody(ctx),
    EventName: eventName,
  })
}

export function reportPlaybackStopped(ctx) {
  return embyClient.post('/Sessions/Playing/Stopped', buildPlaybackBody(ctx))
}

export function secondsToTicks(sec) {
  return Math.floor(Number(sec) || 0) * TICKS_PER_SEC
}

function pickMediaSource(data) {
  const srcs = data?.MediaSources || data?.mediaSources
  if (!srcs?.length) return null
  return srcs[0]
}

export function buildStreamUrl(itemId, playbackData) {
  const ms = pickMediaSource(playbackData)
  if (!ms) return ''
  const playSessionId = resolvePlaySessionId(playbackData)
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
  const playSessionId = resolvePlaySessionId(playbackData)
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