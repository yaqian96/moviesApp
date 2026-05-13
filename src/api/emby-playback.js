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
      MaxStreamingBitrate: 120_000_000,
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

function pickPlaybackAudioStreamIndex(ms) {
  if (!ms?.MediaStreams?.length) return undefined
  const d = ms.DefaultAudioStreamIndex ?? ms.defaultAudioStreamIndex
  if (typeof d === 'number' && !Number.isNaN(d)) return d
  const audios = ms.MediaStreams.filter(
    (s) => s.Type === 'Audio' && typeof s.Index === 'number'
  )
  if (!audios.length) return undefined
  const score = (s) => {
    const t = `${s.DisplayTitle || ''} ${s.Language || ''}`.toLowerCase()
    if (/jpn|ja\b|japanese|日本語|日语/.test(t)) return 4
    if (/chi|zh|chinese|中文|简体|繁体|mandarin/.test(t)) return 3
    if (/eng|english|英语|英文/.test(t)) return 2
    return 0
  }
  let best = audios[0]
  let bestScore = score(best)
  for (let i = 1; i < audios.length; i++) {
    const s = audios[i]
    const sc = score(s)
    if (sc > bestScore) {
      bestScore = sc
      best = s
    }
  }
  return best.Index
}

function primaryAudioStreamForPlayback(ms) {
  if (!ms?.MediaStreams?.length) return null
  const ix = pickPlaybackAudioStreamIndex(ms)
  if (typeof ix === 'number') {
    const hit = ms.MediaStreams.find((s) => s.Type === 'Audio' && s.Index === ix)
    if (hit) return hit
  }
  return ms.MediaStreams.find((s) => s.Type === 'Audio') || null
}

function needsTranscodedAudioForBrowser(ms) {
  const a = primaryAudioStreamForPlayback(ms)
  if (!a) return false
  const c = (
    a.Codec ||
    a.codec ||
    a.CodecTag ||
    a.codecTag ||
    ''
  ).toLowerCase()
  if (!c) return false
  const ok = ['aac', 'mp3', 'opus', 'vorbis', 'mp4a']
  if (ok.some((x) => c === x || c.startsWith(x))) return false
  const bad = ['ac3', 'eac3', 'dts', 'truehd', 'atmos', 'dca', 'mp2', 'flac', 'alac']
  if (bad.some((x) => c.includes(x))) return true
  if (c.startsWith('pcm')) return true
  return false
}

function normalizePlaybackSubpath(p) {
  const s = String(p).trim()
  if (!s) return ''
  let x = s
  if (x.startsWith('/emby/')) x = x.slice('/emby'.length)
  else if (x.toLowerCase().startsWith('emby/')) x = `/${x.slice(5)}`
  return x.startsWith('/') ? x : `/${x}`
}

function playbackPathToAbsolute(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return ''
  const p = pathOrUrl.trim()
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  const root = apiRoot()
  const path = normalizePlaybackSubpath(p)
  return `${String(root).replace(/\/$/, '')}${path}`
}

function appendPlaySessionId(url, playSessionId) {
  if (!url || !playSessionId) return url
  if (/[?&]PlaySessionId=/i.test(url)) return url
  const join = url.includes('?') ? '&' : '?'
  return `${url}${join}PlaySessionId=${encodeURIComponent(playSessionId)}`
}

export function buildSubtitleVttUrl(itemId, mediaSourceId, subtitleStreamIndex, playSessionId = '') {
  if (!itemId || !mediaSourceId || subtitleStreamIndex == null) return ''
  const path = `${apiRoot()}/Videos/${itemId}/${mediaSourceId}/Subtitles/${subtitleStreamIndex}/0/Stream.vtt`
  let u = withTokenQuery(path, token())
  u = appendPlaySessionId(u, playSessionId)
  return u
}

export function buildPlaybackSubtitleUrl(itemId, mediaSourceId, stream, playSessionId = '') {
  if (!itemId || !mediaSourceId || !stream) return ''
  const ix = stream.Index
  if (ix == null || ix === '') return ''
  return buildSubtitleVttUrl(itemId, mediaSourceId, ix, playSessionId)
}

export function buildStreamUrl(itemId, playbackData, opts = {}) {
  const ms = pickMediaSource(playbackData)
  if (!ms) return ''
  const playSessionId = resolvePlaySessionId(playbackData)
  const mediaSourceId = ms.Id
  const params = new URLSearchParams()
  if (mediaSourceId) params.set('MediaSourceId', mediaSourceId)
  if (playSessionId) params.set('PlaySessionId', playSessionId)
  const staticStream = opts.static !== false
  if (staticStream) {
    params.set('Static', 'true')
  } else {
    params.set('Static', 'false')
    params.set('VideoCodec', opts.videoCodec || 'h264')
    params.set('AudioCodec', opts.audioCodec || 'aac')
  }
  const audioIx = opts.audioStreamIndex ?? pickPlaybackAudioStreamIndex(ms)
  if (audioIx != null && audioIx !== '') params.set('AudioStreamIndex', String(audioIx))
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
  const audioIx = pickPlaybackAudioStreamIndex(ms)
  if (audioIx != null && audioIx !== '') params.set('AudioStreamIndex', String(audioIx))
  const path = `${apiRoot()}/Videos/${itemId}/master.m3u8?${params.toString()}`
  return withTokenQuery(path, token())
}

export function nativeVideoLikelySupportsHls() {
  if (typeof document === 'undefined') return false
  try {
    const v = document.createElement('video')
    return Boolean(v.canPlayType('application/vnd.apple.mpegurl'))
  } catch {
    return false
  }
}

export function getPlaybackUrlCandidates(itemId, playbackData) {
  const ms = pickMediaSource(playbackData)
  if (!ms) return []
  const tok = token()
  const seen = new Set()
  const out = []

  const add = (u) => {
    if (!u || typeof u !== 'string' || seen.has(u)) return
    seen.add(u)
    out.push(u)
  }

  const browserNeedsAacAudio = needsTranscodedAudioForBrowser(ms)
  const hlsUrl = buildHlsUrl(itemId, playbackData)
  const aacTranscodeUrl = buildStreamUrl(itemId, playbackData, {
    static: false,
    videoCodec: 'h264',
    audioCodec: 'aac',
  })
  const tr = ms.TranscodingUrl || ms.transcodingUrl
  const trAbs = tr ? withTokenQuery(playbackPathToAbsolute(tr), tok) : ''
  const ds = ms.DirectStreamUrl || ms.directStreamUrl
  const dsAbs = ds ? withTokenQuery(playbackPathToAbsolute(ds), tok) : ''
  const staticMp4 = buildStreamUrl(itemId, playbackData, { static: true })

  if (browserNeedsAacAudio) {
    add(hlsUrl)
    if (aacTranscodeUrl) add(aacTranscodeUrl)
    if (trAbs) add(trAbs)
    if (dsAbs) add(dsAbs)
    add(staticMp4)
  } else {
    if (dsAbs) add(dsAbs)
    add(staticMp4)
    add(hlsUrl)
    if (aacTranscodeUrl) add(aacTranscodeUrl)
    if (trAbs) add(trAbs)
  }

  add(buildDirectUrl(itemId, ms.Id))

  return out
}

export function buildDirectUrl(itemId, mediaSourceId) {
  if (!mediaSourceId) return ''
  const root = apiRoot()
  const path = `${root}/Items/${itemId}/Download?api_key=${token()}`
  return path
}
