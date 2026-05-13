<template>
  <view class="flex min-h-screen flex-col bg-black">
    <view class="flex shrink-0 items-center p-2 relative z-50">
      <wd-button type="text" custom-class="!text-white" @click="back">返回</wd-button>
      <text class="text-white text-base ml-4 line-clamp-1">{{ itemInfo?.Name || '' }}</text>
    </view>
    <view v-if="loading" class="flex flex-1 items-center justify-center text-white text-opacity-60">
      <wd-loading />
    </view>
    <view v-else-if="err" class="flex flex-1 flex-col p-4 text-sm text-rose-200 items-center justify-center">
      <view>
        <view>{{ err }}</view>
        <view v-if="debugInfo" class="mt-2 text-xs text-white text-opacity-40">
          <pre>{{ debugInfo }}</pre>
        </view>
      </view>
    </view>
    <view v-else-if="src" ref="playShellRef" class="flex-1 flex flex-col min-h-0 w-full">
      <view
        class="relative z-0 flex-1 min-h-0 w-full overflow-hidden bg-black"
        @click="togglePlayPause"
      >
        <video
          id="embyPlayVideo"
          ref="videoRef"
          :src="videoElementSrc"
          class="emby-play-video absolute inset-0 block h-full w-full max-h-full max-w-full"
          style="object-fit: contain;"
          :controls="false"
          :show-progress="false"
          :enable-progress-gesture="false"
          :muted="videoMutedAttr"
          preload="metadata"
          autoplay
          webkit-playsinline
          playsinline
          x5-playsinline
          x-webkit-airplay="allow"
          @error="onVideoErr"
          @loadedmetadata="onLoaded"
          @play="onPlayUi"
          @playing="onVideoPlaying"
          @pause="onPauseUi"
          @timeupdate="onTimeUpdate"
          @seeked="onSeeked"
          @ended="onEnded"
          @click.stop="togglePlayPause"
          @canplay="onVideoCanPlay"
        >
        </video>

        <view
          v-show="playbackUiPaused"
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <view
            class="pointer-events-auto h-16 w-16 flex items-center justify-center rounded-full bg-black bg-opacity-55"
            @click.stop="togglePlayPause"
          >
            <text class="text-3xl text-white pl-1">▶</text>
          </view>
        </view>
      </view>

      <view
        class="play-toolbar relative z-10 w-full min-w-0 shrink-0 flex flex-nowrap items-center gap-1 border-t border-white border-opacity-15 bg-black px-3 py-2.5"
        @click.stop
      >
        <wd-button
          type="text"
          size="small"
          custom-class="!text-white !min-w-0 !shrink-0 !p-1"
          @click.stop="togglePlayPause"
        >
          <text class="text-lg">{{ playbackUiPaused ? '▶' : '❚❚' }}</text>
        </wd-button>

        <view class="play-toolbar-progress flex min-w-0 flex-1 items-center gap-1">
          <text class="w-10 shrink-0 text-right text-[10px] leading-4 tabular-nums text-white text-opacity-80">
            {{ formatTime(currentTimeDisplay) }}
          </text>
          <slider
            class="play-progress-slider h-8 min-w-[72px] flex-1"
            :value="progress"
            min="0"
            max="100"
            step="0.5"
            activeColor="#409eff"
            backgroundColor="rgba(255,255,255,0.25)"
            blockSize="16"
            @changing="onProgressSliderChanging"
            @change="onProgressSliderChange"
          />
          <text class="w-10 shrink-0 text-left text-[10px] leading-4 tabular-nums text-white text-opacity-80">
            {{ durationReady ? formatTime(durationDisplay) : '--:--' }}
          </text>
        </view>

        <view class="flex shrink-0 items-center gap-0.5">
          <view class="toolbar-icon-slot relative z-[200] flex h-10 w-10 shrink-0 items-center justify-center">
            <template v-if="episodes.length > 0">
              <view class="relative flex h-full w-full items-center justify-center">
                <wd-button
                  type="text"
                  custom-class="!text-white !p-0 !px-1 !min-w-0 !h-10 !max-h-10 !text-xs !leading-none"
                  @click.stop="toggleEpisodeList"
                >
                  <text class="text-white">集数</text>
                </wd-button>
                <view
                  v-if="showEpisodeList"
                  class="absolute bottom-full right-0 z-[200] mb-1.5 max-h-80 w-64 overflow-y-auto rounded-lg bg-black bg-opacity-95 p-3 shadow-lg"
                >
                  <view class="mb-2 text-sm font-medium text-white">选择集数</view>
                  <view
                    v-for="(ep, idx) in episodes"
                    :key="ep.Id"
                    class="cursor-pointer rounded py-2 px-3 hover:bg-white hover:bg-opacity-10"
                    :class="ep.Id === id ? 'bg-white bg-opacity-10' : ''"
                    @click.stop="switchEpisode(ep)"
                  >
                    <text class="text-sm text-white">
                      第{{ ep.ParentIndexNumber || 1 }}季 第{{ ep.IndexNumber || idx + 1 }}集
                    </text>
                    <text v-if="ep.Name" class="ml-2 text-xs text-white text-opacity-60">{{ ep.Name }}</text>
                  </view>
                </view>
              </view>
            </template>
          </view>

          <view class="toolbar-icon-slot relative z-[200] flex h-10 w-10 shrink-0 items-center justify-center">
            <view
              class="flex h-10 w-10 items-center justify-center rounded active:bg-white active:bg-opacity-10"
              @click.stop="toggleVolumePanel"
            >
              <text class="text-sm leading-none">{{ volume < 0.001 ? '🔇' : '🔊' }}</text>
            </view>
            <view
              v-if="showVolumePanel"
              class="volume-v-flyout absolute bottom-full left-1/2 z-[200] mb-1 flex w-[3.25rem] -translate-x-1/2 flex-col items-center rounded-[12px] px-2 pb-2.5 pt-2 shadow-lg"
              @click.stop
            >
              <text class="volume-v-flyout-num mb-1 text-center text-[13px] font-medium tabular-nums text-white">
                {{ volumePercent }}
              </text>
              <view
                ref="volumeRailRef"
                class="volume-custom-rail"
                @touchstart.stop="onVolumeRailStart"
                @touchmove.stop.prevent="onVolumeRailMove"
                @touchend.stop="onVolumeRailEnd"
                @touchcancel.stop="onVolumeRailEnd"
                @mousedown.stop="onVolumeRailMouseDown"
              >
                <view class="volume-custom-track-bg" />
                <view
                  class="volume-custom-track-fill"
                  :style="{ height: volumeFillHeightPx + 'px' }"
                />
                <view
                  class="volume-custom-thumb"
                  :style="{ bottom: volumeThumbBottomPx + 'px' }"
                />
              </view>
              <view
                class="mt-2 text-center text-[11px] leading-tight text-white text-opacity-80"
                @click.stop="toggleMute"
              >
                <text>{{ volume < 0.001 ? '取消静音' : '静音' }}</text>
              </view>
            </view>
          </view>

          <view class="toolbar-icon-slot flex h-10 w-10 shrink-0 items-center justify-center">
            <wd-button
              type="text"
              custom-class="!text-white !p-0 !min-w-0 !h-10 !w-10 !flex !items-center !justify-center"
              @click.stop="toggleFullscreen"
            >
              <text class="text-lg leading-none">⛶</text>
            </wd-button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, watch, nextTick } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import {
  getPlaybackInfo,
  getPlaybackUrlCandidates,
  resolvePlaySessionId,
  newPlaySessionId,
  buildPlaybackSubtitleUrl,
  nativeVideoLikelySupportsHls,
} from '@/api/emby-playback'
import { fetchItemById, fetchUserItems } from '@/api/emby-items'
import { parseSubtitleTextToCues } from '@/utils/parse-subtitle-cues'
import { withTokenQuery } from '@/utils/emby-url'

const user = useUserStore()

const id = ref('')
const loading = ref(true)
const src = ref('')
const err = ref('')
const debugInfo = ref('')
const videoRef = ref(null)
const playShellRef = ref(null)
const itemInfo = ref(null)
const episodes = ref([])
const subtitleList = ref([])
const currentSubtitle = ref(-1)
const volume = ref(1)
const volumeBeforeMute = ref(1)
const videoMutedAttr = computed(() => volume.value < 0.001)
const brightness = ref(100)
const playbackMediaSourceId = ref('')

const volumePercent = computed(() =>
  Math.round(Math.max(0, Math.min(1, Number(volume.value) || 0)) * 100)
)

const session = ref(null)
const progress = ref(0)
const duration = ref(0)
const showEpisodeList = ref(false)
const showVolumePanel = ref(false)
const playbackUiPaused = ref(false)
const currentTimeDisplay = ref(0)
const durationDisplay = ref(0)
const durationReady = ref(false)
const isScrubbingProgress = ref(false)
let subtitleFetchGen = 0
let subtitleSyncTimeouts = []
let urlList = []
let currentUrlIndex = 0
let playbackUiRafId = 0
let hlsInstance = null
const hlsDriverActive = ref(false)
const videoElementSrc = computed(() => (hlsDriverActive.value ? '' : src.value))

function isTextSubtitleStream(s) {
  if (!s || s.Type !== 'Subtitle') return false
  if (s.IsTextSubtitleStream === true) return true
  const codec = (s.Codec || s.codec || '').toLowerCase()
  if (codec.includes('hdmv_text')) return true
  const bitmap = [
    'dvdsub',
    'dvd_subtitle',
    'dvbsub',
    'pgs',
    'pgssub',
    'vobsub',
    'xsub',
    'sup',
    'idx',
    'dvb_sub',
    'dvb_lib',
    'teletext',
    'eia_708',
    'bluray',
  ]
  if (bitmap.some((x) => codec.includes(x))) return false
  if (codec.includes('hdmv') && !codec.includes('text')) return false
  const text = [
    'subrip',
    'srt',
    'ass',
    'ssa',
    'webvtt',
    'vtt',
    'mov_text',
    'subviewer',
    'microdvd',
    'txt',
    'ttml',
    'stpp',
    'sami',
    'smi',
    'mpl2',
    'pjs',
    'realtext',
    'stl',
    'tx3g',
    'timed',
    'json',
    'aqt',
    'sub',
  ]
  if (text.some((x) => codec === x || codec.includes(x))) return true
  if (s.IsExternal === true || s.isExternal === true) return true
  if (!codec) {
    if (s.IsTextSubtitleStream === false) return false
    if (s.IsExternal === true || s.isExternal === true) return true
    return false
  }
  return false
}

function applySubtitlesFromMediaSource(ms) {
  if (!ms?.MediaStreams?.length) {
    subtitleList.value = []
    return
  }
  const subs = ms.MediaStreams.filter(
    (s) => s.Type === 'Subtitle' && isTextSubtitleStream(s)
  )
  subs.sort((a, b) => {
    const extRank = (x) => (x.IsExternal === true || x.isExternal === true ? 0 : 1)
    const r = extRank(a) - extRank(b)
    if (r !== 0) return r
    const ai = typeof a.Index === 'number' ? a.Index : 99999
    const bi = typeof b.Index === 'number' ? b.Index : 99999
    return ai - bi
  })
  subtitleList.value = subs
}

function pickDefaultSubtitleIndex(list) {
  if (!list?.length) return -1
  const blob = (s) =>
    `${s.DisplayTitle || ''} ${s.Language || ''} ${s.Title || ''}`.toLowerCase()
  const isChinese = (s) =>
    /chi|zh\b|zho|cmn|yue|cn\b|chs|cht|mandarin|chinese|简体|繁体|中文|国语|粤语|華語/.test(
      blob(s)
    )
  const chineseIdx = list.findIndex(isChinese)
  if (chineseIdx >= 0) return chineseIdx
  const def = list.findIndex((s) => s.IsDefault === true || s.isDefault === true)
  if (def >= 0) return def
  const score = (s) => {
    const t = blob(s)
    if (/jpn|ja|japanese|日本語|日语/.test(t)) return 4
    if (/kor|ko|korean|韩语|朝鲜/.test(t)) return 3
    if (/eng|english|英语|英文/.test(t)) return 2
    if (/fre|fra|fr\b|德语|deu|spa|es\b|俄语|rus/.test(t)) return 1
    return 0
  }
  let best = 0
  let bestScore = score(list[0])
  for (let i = 1; i < list.length; i++) {
    const sc = score(list[i])
    if (sc > bestScore) {
      bestScore = sc
      best = i
    }
  }
  return best
}

function formatSubtitleMenuLabel(sub, idx) {
  const ext = sub.IsExternal === true || sub.isExternal === true
  const source = ext ? '外挂' : '内嵌'
  const lang = (sub.Language || sub.language || '').trim()
  const title = (sub.DisplayTitle || sub.displayTitle || '').trim()
  const forced =
    sub.IsForced === true || sub.isForced === true
      ? '（强制）'
      : ''
  if (lang && title) {
    const tl = title.toLowerCase()
    const ll = lang.toLowerCase()
    if (tl === ll || tl.startsWith(`${ll} `) || tl.includes(`[${ll}]`)) {
      return `${source} · ${title}${forced} (#${sub.Index ?? idx})`
    }
    return `${source} · ${lang} · ${title}${forced} (#${sub.Index ?? idx})`
  }
  const one = title || lang
  if (one) return `${source} · ${one}${forced} (#${sub.Index ?? idx})`
  return `${source} · 字幕 ${idx + 1}${forced} (#${sub.Index ?? idx})`
}

function subtitleAuthHeaders() {
  const tok = user.activeToken
  return tok ? { 'X-Emby-Token': tok } : {}
}

async function fetchSubtitlePlainText(apiUrl) {
  const res = await fetch(apiUrl, {
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    headers: { ...subtitleAuthHeaders() },
  })
  if (!res.ok) throw new Error(String(res.status))
  return (await res.text()).replace(/^\uFEFF/, '')
}

let embySoftTextTrack = null
const softSubtitleCache = ref(null)

function clearTextTrackCues(track) {
  if (!track?.cues) return
  for (let i = track.cues.length - 1; i >= 0; i--) {
    try {
      track.removeCue(track.cues[i])
    } catch {
      /* noop */
    }
  }
}

function trackOnVideo(track, video) {
  if (!track || !video?.textTracks) return false
  for (let i = 0; i < video.textTracks.length; i++) {
    if (video.textTracks[i] === track) return true
  }
  return false
}

function disposeEmbySoftSubtitle() {
  if (!embySoftTextTrack) return
  try {
    clearTextTrackCues(embySoftTextTrack)
    embySoftTextTrack.mode = 'disabled'
  } catch {
    /* noop */
  }
  embySoftTextTrack = null
}

function applyEmbySoftSubtitleCues(video, cues, label) {
  if (!video || !cues?.length) return
  if (!trackOnVideo(embySoftTextTrack, video)) {
    embySoftTextTrack = null
  }
  if (!embySoftTextTrack) {
    embySoftTextTrack = video.addTextTrack('subtitles', label || 'Emby', 'und')
  } else {
    clearTextTrackCues(embySoftTextTrack)
    try {
      embySoftTextTrack.label = label || 'Emby'
    } catch {
      /* noop */
    }
  }
  for (const c of cues) {
    try {
      embySoftTextTrack.addCue(new VTTCue(c.start, c.end, c.text))
    } catch (e) {
      console.warn('[play] VTTCue', e)
    }
  }
  for (let i = 0; i < video.textTracks.length; i++) {
    const t = video.textTracks[i]
    if (t !== embySoftTextTrack && (t.kind === 'subtitles' || t.kind === 'captions')) {
      t.mode = 'disabled'
    }
  }
  embySoftTextTrack.mode = 'showing'
}

function reapplySoftSubtitleFromCache() {
  const c = softSubtitleCache.value
  if (
    !c?.cues?.length ||
    currentSubtitle.value < 0 ||
    typeof c.listIndex !== 'number' ||
    currentSubtitle.value !== c.listIndex
  ) {
    return
  }
  const v = resolveVideoEl()
  if (!v) return
  applyEmbySoftSubtitleCues(v, c.cues, c.label)
}

function ensureSoftSubtitleMode() {
  try {
    if (embySoftTextTrack) embySoftTextTrack.mode = 'showing'
  } catch {
    /* noop */
  }
}

const subtitleTrackSrc = computed(() => {
  if (currentSubtitle.value < 0) return ''
  const s = subtitleList.value[currentSubtitle.value]
  if (!s || !id.value || !playbackMediaSourceId.value) return ''
  const pid = session.value?.playSessionId || ''
  return buildPlaybackSubtitleUrl(id.value, playbackMediaSourceId.value, s, pid)
})

const subtitleTrackLabel = computed(() => {
  if (currentSubtitle.value < 0) return ''
  const s = subtitleList.value[currentSubtitle.value]
  if (!s) return '字幕'
  return formatSubtitleMenuLabel(s, currentSubtitle.value)
})

watch(
  subtitleTrackSrc,
  async (url) => {
    disposeEmbySoftSubtitle()
    softSubtitleCache.value = null
    if (!url) {
      clearSubtitleSyncTimeouts()
      nextTick(() => applyVolumeToVideo())
      return
    }
    const listIdx = currentSubtitle.value
    const stream = subtitleList.value[listIdx]
    if (!stream || typeof stream.Index !== 'number') {
      console.warn('[play] subtitle: no MediaStream at list index', listIdx)
      return
    }
    const label = subtitleTrackLabel.value
    const gen = ++subtitleFetchGen
    try {
      const raw = await fetchSubtitlePlainText(url)
      if (gen !== subtitleFetchGen) return
      const cues = parseSubtitleTextToCues(raw)
      if (!cues.length) {
        console.warn('[play] subtitle: no cues parsed, StreamIndex=', stream.Index)
        return
      }
      softSubtitleCache.value = {
        listIndex: listIdx,
        streamIndex: stream.Index,
        label,
        cues,
      }
      let tries = 0
      const tryApply = () => {
        if (gen !== subtitleFetchGen) return
        const v = resolveVideoEl()
        if (v) {
          applyEmbySoftSubtitleCues(v, cues, label)
          scheduleSubtitleTrackSync()
          applyVolumeToVideo()
        } else if (tries++ < 60) {
          setTimeout(tryApply, 48)
        } else {
          console.warn('[play] video not ready for soft subtitle')
        }
      }
      await nextTick()
      tryApply()
    } catch (e) {
      if (gen !== subtitleFetchGen) return
      console.warn('[play] subtitle fetch/parse failed', e)
    }
  },
  { immediate: true }
)

watch(currentSubtitle, () => {
  nextTick(() => {
    ensureSoftSubtitleMode()
    scheduleSubtitleTrackSync()
    applyVolumeToVideo()
  })
})

function clearSubtitleSyncTimeouts() {
  for (const t of subtitleSyncTimeouts) clearTimeout(t)
  subtitleSyncTimeouts = []
}

function scheduleSubtitleTrackSync() {
  clearSubtitleSyncTimeouts()
  if (currentSubtitle.value < 0 || !softSubtitleCache.value?.cues?.length) return
  ;[0, 40, 120, 240, 500, 1000].forEach((ms) => {
    subtitleSyncTimeouts.push(
      setTimeout(() => {
        ensureSoftSubtitleMode()
      }, ms)
    )
  })
}

function syncSubtitleTracks() {
  ensureSoftSubtitleMode()
}
function formatTime(sec) {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(ss)}`
  return `${m}:${pad(ss)}`
}

function stopPlaybackUiLoop() {
  if (playbackUiRafId && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(playbackUiRafId)
  }
  playbackUiRafId = 0
}

function syncProgressFromVideo(video) {
  if (!video) return
  let t = video.currentTime
  if (!Number.isFinite(t) || t < 0) t = 0
  currentTimeDisplay.value = t

  const vd = video.duration
  if (Number.isFinite(vd) && vd > 0) {
    duration.value = vd
    durationDisplay.value = vd
    durationReady.value = true
    if (!isScrubbingProgress.value) {
      progress.value = (t / vd) * 100
    }
  }
}

function runPlaybackUiLoop() {
  stopPlaybackUiLoop()
  const step = () => {
    const v = resolveVideoEl()
    if (!v || v.paused || v.ended) {
      playbackUiRafId = 0
      return
    }
    syncProgressFromVideo(v)
    playbackUiRafId =
      typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(step) : 0
  }
  if (typeof requestAnimationFrame !== 'undefined') {
    playbackUiRafId = requestAnimationFrame(step)
  }
}

function togglePlayPause() {
  const v = resolveVideoEl()
  if (!v) return
  try {
    if (v.paused) {
      applyVolumeToVideo()
      void safePlayVideo(v)
    } else {
      v.pause()
    }
  } catch {
    applyVolumeToVideo()
  }
}

function safePlayVideo(video) {
  if (!video) return Promise.resolve()
  try {
    const p = video.play()
    if (p && typeof p.then === 'function') {
      return p
        .then(() => applyVolumeToVideo())
        .catch((err) => {
          if (err?.name === 'AbortError') return
          console.warn('[play] play() rejected:', err?.name, err?.message)
        })
    }
    applyVolumeToVideo()
    return Promise.resolve()
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.warn('[play] play() threw:', err?.name, err?.message)
    }
    return Promise.resolve()
  }
}

function onVideoCanPlay() {
  applyVolumeToVideo()
}

function onPlayUi() {
  playbackUiPaused.value = false
  nextTick(() => {
    applyVolumeToVideo()
    runPlaybackUiLoop()
  })
}

function onVideoPlaying() {
  applyVolumeToVideo()
  runPlaybackUiLoop()
}

function onPauseUi() {
  playbackUiPaused.value = true
  stopPlaybackUiLoop()
  const v = resolveVideoEl()
  if (v) syncProgressFromVideo(v)
}

function getVideoDuration() {
  const video = resolveVideoEl()
  const vd = video?.duration
  if (Number.isFinite(vd) && vd > 0) return vd
  if (duration.value > 0 && Number.isFinite(duration.value)) return duration.value
  return 0
}

function applyProgressSeekValue(val) {
  if (!Number.isFinite(val)) return
  const video = resolveVideoEl()
  const dur = getVideoDuration()
  if (!video || !dur) return
  const sec = Math.max(0, Math.min((val / 100) * dur, Math.max(dur - 0.05, 0)))
  try {
    video.currentTime = sec
  } catch {
    try {
      if (typeof video.fastSeek === 'function') {
        video.fastSeek(sec)
      }
    } catch {
      /* noop */
    }
  }
  progress.value = val
  currentTimeDisplay.value = video.currentTime ?? sec
}

function onProgressSliderChanging(e) {
  const val = e?.detail?.value
  if (val === undefined || val === null) return
  isScrubbingProgress.value = true
  applyProgressSeekValue(Number(val))
}

function onProgressSliderChange(e) {
  const val = e?.detail?.value
  if (val === undefined || val === null) return
  applyProgressSeekValue(Number(val))
  nextTick(() => {
    isScrubbingProgress.value = false
  })
}

function applyVolumeToVideo() {
  const video = resolveVideoEl()
  if (!video) return
  const vol = Math.max(0, Math.min(1, Number(volume.value) || 0))
  try {
    video.volume = vol
    const muted = vol <= 0.0001
    if (muted) {
      video.muted = true
      return
    }
    try {
      video.removeAttribute('muted')
    } catch {
      /* noop */
    }
    video.muted = false
    if (typeof video.defaultMuted === 'boolean') {
      video.defaultMuted = false
    }
  } catch {
    /* noop */
  }
}

function resolveVideoEl() {
  const r = videoRef.value
  if (r) {
    if (r.tagName === 'VIDEO') return r
    const el = r.$el
    if (el?.tagName === 'VIDEO') return el
    const inner = el?.querySelector?.('video')
    if (inner) return inner
  }
  if (typeof document !== 'undefined') {
    const byId = document.getElementById('embyPlayVideo')
    if (byId && byId.tagName === 'VIDEO') return byId
  }
  return null
}

onLoad(async (opts) => {
  if (!user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  id.value = (opts && opts.id) || ''
  if (id.value) {
    await loadItemInfo()
    await start()
  } else {
    err.value = '缺少视频 ID'
    loading.value = false
  }
})

onUnload(() => {})

onBeforeUnmount(() => {
  detachPlaybackDriver()
  disposeEmbySoftSubtitle()
  softSubtitleCache.value = null
  clearSubtitleSyncTimeouts()
  stopPlaybackUiLoop()
  onVolumeRailMouseUp()
})

function toggleEpisodeList() {
  showEpisodeList.value = !showEpisodeList.value
  if (showEpisodeList.value) {
    showVolumePanel.value = false
  }
}

function toggleVolumePanel() {
  showVolumePanel.value = !showVolumePanel.value
  if (showVolumePanel.value) {
    showEpisodeList.value = false
    nextTick(() => applyVolumeToVideo())
  }
}

function back() {
  uni.navigateBack()
}

function onTimeUpdate() {
  const video = resolveVideoEl()
  if (video) syncProgressFromVideo(video)
}

function onSeeked() {
  const video = resolveVideoEl()
  if (video) syncProgressFromVideo(video)
}

function onEnded() {
  playbackUiPaused.value = true
  stopPlaybackUiLoop()
  const v = resolveVideoEl()
  if (v) syncProgressFromVideo(v)
}

function onLoaded() {
  const video = resolveVideoEl()
  if (video) {
    duration.value = video.duration || 0
    durationDisplay.value = duration.value
    currentTimeDisplay.value = 0
    durationReady.value = Number.isFinite(video.duration) && video.duration > 0
    applyVolumeToVideo()
    playbackUiPaused.value = video.paused
    nextTick(() => {
      applyVolumeToVideo()
      reapplySoftSubtitleFromCache()
      syncSubtitleTracks()
      syncProgressFromVideo(video)
      if (!video.paused) runPlaybackUiLoop()
    })
  }
}

function readVideoMediaError(video) {
  if (!video?.error) return null
  const code = video.error.code
  const label =
    code === 1
      ? 'MEDIA_ERR_ABORTED'
      : code === 2
        ? 'MEDIA_ERR_NETWORK'
        : code === 3
          ? 'MEDIA_ERR_DECODE'
          : code === 4
            ? 'MEDIA_ERR_SRC_NOT_SUPPORTED'
            : `MEDIA_ERR_${code}`
  return {
    mediaErrorCode: code,
    mediaErrorLabel: label,
    mediaErrorMessage: video.error.message || '',
    networkState: video.networkState,
    readyState: video.readyState,
    currentSrc: video.currentSrc || video.src || '',
  }
}

function onVideoErr(e) {
  const video = resolveVideoEl()
  const mediaErr = readVideoMediaError(video)
  console.warn('Video error:', mediaErr || '(no MediaError)', 'event:', e?.type)
  currentUrlIndex++
  if (currentUrlIndex < urlList.length) {
    console.log('Trying next URL:', urlList[currentUrlIndex])
    src.value = urlList[currentUrlIndex]
  } else {
    err.value = '无法播放。浏览器可能不支持该视频格式。'
    debugInfo.value = `已尝试以下URL:\n${urlList.join('\n')}`
  }
}

function isH5Env() {
  return typeof import.meta !== 'undefined' && import.meta.env?.UNI_PLATFORM === 'h5'
}

function isHlsUrl(u) {
  if (!u || typeof u !== 'string') return false
  return /\.m3u8(\?|#|$)/i.test(u) || /\/master\.m3u8/i.test(u)
}

function detachPlaybackDriver() {
  if (hlsInstance) {
    try {
      hlsInstance.destroy()
    } catch {
      /* noop */
    }
    hlsInstance = null
  }
  hlsDriverActive.value = false
}

async function syncVideoPlaybackDriver() {
  const url = src.value
  detachPlaybackDriver()
  await nextTick()
  const v = resolveVideoEl()
  if (!url || !v) return

  const useHlsJs = isH5Env() && isHlsUrl(url) && !nativeVideoLikelySupportsHls()
  if (!useHlsJs) return

  let HlsMod
  try {
    HlsMod = await import('hls.js')
  } catch (e) {
    console.warn('[play] hls.js load failed', e)
    return
  }
  const Hls = HlsMod.default
  if (!Hls.isSupported() || src.value !== url) return

  hlsDriverActive.value = true
  await nextTick()
  const v2 = resolveVideoEl()
  if (!v2 || src.value !== url) {
    hlsDriverActive.value = false
    return
  }

  const hls = new Hls({
    enableWorker: false,
    lowLatencyMode: false,
    maxBufferLength: 25,
    maxMaxBufferLength: 120,
    startFragPrefetch: true,
    xhrSetup(xhr, url) {
      const tok = user.activeToken
      const u = tok ? withTokenQuery(url, tok) : url
      xhr.open('GET', u, true)
      if (tok) {
        xhr.setRequestHeader('X-Emby-Token', tok)
      }
    },
  })
  hlsInstance = hls
  hls.on(Hls.Events.ERROR, (_ev, data) => {
    if (!data?.fatal) return
    console.warn('[play] HLS fatal:', data.type, data.details)
    detachPlaybackDriver()
    onVideoErr({ type: 'hls-error', detail: data })
  })
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    applyVolumeToVideo()
    try {
      if (hls.audioTracks?.length && hls.audioTrack === -1) {
        hls.audioTrack = 0
      }
    } catch {
      /* noop */
    }
    nextTick(() => {
      reapplySoftSubtitleFromCache()
      syncSubtitleTracks()
    })
    void safePlayVideo(resolveVideoEl())
  })
  hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, () => {
    applyVolumeToVideo()
  })
  hls.loadSource(url)
  hls.attachMedia(v2)
}

watch(
  () => src.value,
  () => {
    durationReady.value = false
    void syncVideoPlaybackDriver()
  }
)

async function loadItemInfo() {
  try {
    const { data } = await fetchItemById(id.value)
    itemInfo.value = data

    let seriesId = data?.SeriesId || ''
    if (!seriesId && data?.Type === 'Episode') {
      const seasonOrParent = data.SeasonId || data.ParentId
      if (seasonOrParent) {
        try {
          const { data: p } = await fetchItemById(seasonOrParent)
          seriesId =
            p?.SeriesId ||
            (p?.Type === 'Series' ? p.Id : '') ||
            (p?.ParentId && p.Type === 'Season' ? p.ParentId : '')
          if (!seriesId && p?.ParentId) {
            const { data: maybeSeries } = await fetchItemById(p.ParentId)
            if (maybeSeries?.Type === 'Series') seriesId = maybeSeries.Id
          }
        } catch {
          /* noop */
        }
      }
    }

    if (seriesId) {
      const { data: seriesData } = await fetchUserItems({
        ParentId: seriesId,
        IncludeItemTypes: 'Episode',
        Recursive: true,
        SortBy: 'ParentIndexNumber,IndexNumber',
        SortOrder: 'Ascending',
        Fields:
          'PrimaryImageAspectRatio,Overview,RunTimeTicks,UserData,MediaSources,ParentIndexNumber,IndexNumber,SeasonName,SeriesName,Name',
      })
      episodes.value = seriesData?.Items || []
    } else {
      episodes.value = []
    }

    if (data?.MediaSources?.length) {
      applySubtitlesFromMediaSource(data.MediaSources[0])
    }
  } catch (e) {
    console.error('Load item info error:', e)
  }
}

function switchEpisode(ep) {
  if (ep.Id === id.value) return
  showEpisodeList.value = false
  currentSubtitle.value = -1
  uni.redirectTo({
    url: `/pages/play/play?id=${ep.Id}`,
  })
}

const volumeRailRef = ref(null)
let volumeRailDragging = false

const VOL_RAIL_H_PX = 128
const VOL_PAD_PX = 8
const VOL_THUMB_PX = 18
const volTrackInnerPx = VOL_RAIL_H_PX - VOL_PAD_PX * 2

const volumeFillHeightPx = computed(() => (volumePercent.value / 100) * volTrackInnerPx)

const volumeThumbBottomPx = computed(() => {
  const p = volumePercent.value / 100
  return VOL_PAD_PX + p * volTrackInnerPx - VOL_THUMB_PX / 2
})

function volumeRailDom() {
  const r = volumeRailRef.value
  if (!r) return null
  if (r.nodeType === 1) return r
  if (r.$el && r.$el.nodeType === 1) return r.$el
  return null
}

function applyVolumeFromClientY(clientY) {
  const el = volumeRailDom()
  if (!el || typeof el.getBoundingClientRect !== 'function') return
  const rect = el.getBoundingClientRect()
  const top = rect.top + VOL_PAD_PX
  const bottom = rect.bottom - VOL_PAD_PX
  const h = bottom - top
  if (h <= 0) return
  const pct = Math.round(((bottom - clientY) / h) * 100)
  const clamped = Math.max(0, Math.min(100, pct))
  volume.value = clamped / 100
  applyVolumeToVideo()
}

function onVolumeRailStart(e) {
  volumeRailDragging = true
  const t = e.touches?.[0]
  if (t && t.clientY != null) applyVolumeFromClientY(t.clientY)
}

function onVolumeRailMove(e) {
  if (!volumeRailDragging) return
  const t = e.touches?.[0]
  if (t && t.clientY != null) applyVolumeFromClientY(t.clientY)
}

function onVolumeRailEnd() {
  volumeRailDragging = false
}

function onVolumeRailMouseMove(ev) {
  if (!volumeRailDragging) return
  if (ev.clientY != null) applyVolumeFromClientY(ev.clientY)
}

function onVolumeRailMouseUp() {
  volumeRailDragging = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', onVolumeRailMouseMove)
    window.removeEventListener('mouseup', onVolumeRailMouseUp)
  }
}

function onVolumeRailMouseDown(e) {
  if (typeof e.button === 'number' && e.button !== 0) return
  volumeRailDragging = true
  if (e.clientY != null) applyVolumeFromClientY(e.clientY)
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', onVolumeRailMouseMove)
    window.addEventListener('mouseup', onVolumeRailMouseUp)
  }
}

function toggleMute() {
  if (volume.value > 0.001) {
    volumeBeforeMute.value = volume.value
    volume.value = 0
  } else {
    volume.value = volumeBeforeMute.value > 0.001 ? volumeBeforeMute.value : 1
  }
  applyVolumeToVideo()
}

function toggleFullscreen() {
  const doc = typeof document !== 'undefined' ? document : null
  const inst = playShellRef.value
  const raw = inst && (inst.$el ?? inst)
  const el = raw?.nodeType === 1 ? raw : null
  if (doc?.fullscreenEnabled && el?.requestFullscreen) {
    if (doc.fullscreenElement === el) {
      void doc.exitFullscreen?.()
    } else {
      void el.requestFullscreen()
    }
    return
  }

  const video = resolveVideoEl()
  if (!video) return
  if (doc && typeof doc.fullscreenElement !== 'undefined') {
    if (!doc.fullscreenElement) {
      if (video.requestFullscreen) void video.requestFullscreen()
      else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen()
      else if (video.msRequestFullscreen) video.msRequestFullscreen()
    } else if (doc.exitFullscreen) void doc.exitFullscreen()
    return
  }

  try {
    uni?.createVideoContext?.('embyPlayVideo')?.requestFullScreen?.()
  } catch {
    /* noop */
  }
}

function onBrightnessChange(e) {
  brightness.value = e.detail.value
  const video = resolveVideoEl()
  if (video) {
    const brightnessVal = brightness.value / 100
    video.style.filter = `brightness(${brightnessVal})`
  }
}

async function start() {
  err.value = ''
  loading.value = true
  currentUrlIndex = 0
  urlList = []
  debugInfo.value = ''
  session.value = null
  currentSubtitle.value = -1
  playbackMediaSourceId.value = ''

  try {
    const pb = await getPlaybackInfo(id.value)

    if (!pb?.MediaSources?.length) {
      err.value = '无可用片源'
      debugInfo.value = JSON.stringify(pb, null, 2)
      return
    }

    const ms = pb.MediaSources[0]
    let playSessionId = resolvePlaySessionId(pb)
    if (!playSessionId) {
      playSessionId = newPlaySessionId()
      console.warn(
        '[Emby] PlaybackInfo 未返回 PlaySessionId，已生成本地会话 id；取流将使用该 id'
      )
      pb.PlaySessionId = playSessionId
    }
    session.value = {
      mediaSourceId: ms.Id,
      playSessionId,
    }
    playbackMediaSourceId.value = ms.Id
    applySubtitlesFromMediaSource(ms)
    currentSubtitle.value = pickDefaultSubtitleIndex(subtitleList.value)

    urlList = getPlaybackUrlCandidates(id.value, pb)

    if (urlList.length === 0) {
      err.value = '无法构建播放链接'
      return
    }

    src.value = urlList[0]
    debugInfo.value = ''
  } catch (e) {
    console.error('Playback error:', e)
    const msg = e?.response?.data
    const text =
      typeof msg === 'string' ? msg : (msg && msg.Message) || e?.message || '取流失败'
    err.value = String(text)
    debugInfo.value = e?.stack || String(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.emby-play-video::cue {
  background-color: rgba(0, 0, 0, 0.78);
  color: #fff;
}

.play-toolbar-progress {
  overflow-x: auto;
  overflow-y: clip;
  -webkit-overflow-scrolling: touch;
}

.play-progress-slider {
  flex: 1 1 0%;
  min-width: 72px;
  max-width: 100%;
}

.volume-v-flyout {
  background: rgba(36, 36, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
}

.volume-custom-rail {
  position: relative;
  width: 40px;
  height: 128px;
  flex-shrink: 0;
  touch-action: none;
}

.volume-custom-track-bg {
  position: absolute;
  left: 50%;
  top: 8px;
  bottom: 8px;
  width: 2px;
  transform: translateX(-50%);
  background: #ffffff;
  border-radius: 1px;
  pointer-events: none;
}

.volume-custom-track-fill {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 3px;
  transform: translateX(-50%);
  background: #5eb8ff;
  border-radius: 1px;
  min-height: 0;
  max-height: calc(100% - 16px);
  pointer-events: none;
}

.volume-custom-thumb {
  position: absolute;
  left: 50%;
  width: 18px;
  height: 18px;
  margin-left: -9px;
  border-radius: 50%;
  background: #5eb8ff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
</style>
