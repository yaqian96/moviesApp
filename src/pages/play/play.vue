<template>
  <view class="min-h-screen bg-black flex flex-col">
    <view class="flex items-center p-2">
      <wd-button type="text" custom-class="!text-white" @click="back">返回</wd-button>
    </view>
    <view v-if="loading" class="flex-1 flex items-center justify-center text-white text-opacity-60">
      <wd-loading />
    </view>
    <view v-else-if="err" class="flex-1 p-4 text-sm text-rose-200 flex items-center justify-center">
      <view>
        <view>{{ err }}</view>
        <view v-if="debugInfo" class="mt-2 text-xs text-white text-opacity-40">
          <pre>{{ debugInfo }}</pre>
        </view>
      </view>
    </view>
    <video
      v-else-if="src"
      id="embyPlayVideo"
      ref="videoRef"
      :src="src"
      class="w-full"
      style="height: 90vh;"
      controls
      autoplay
      webkit-playsinline
      playsinline
      x5-playsinline
      x-webkit-airplay="allow"
      :enable-progress-gesture="true"
      @error="onVideoErr"
      @loadedmetadata="onLoaded"
      @playing="onPlaying"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="onTimeUpdate"
      @seeked="onSeeked"
      @seeking="onSeeking"
      @ended="onEnded"
    />
  </view>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import {
  getPlaybackInfo,
  buildStreamUrl,
  buildHlsUrl,
  buildDirectUrl,
  reportPlaybackStarted,
  reportPlaybackProgress,
  reportPlaybackStopped,
  secondsToTicks,
  resolvePlaySessionId,
  newPlaySessionId,
} from '@/api/emby-playback'

const user = useUserStore()

const id = ref('')
const loading = ref(true)
const src = ref('')
const err = ref('')
const debugInfo = ref('')
const videoRef = ref(null)

const session = ref(null)
let urlList = []
let currentUrlIndex = 0
let started = false
let starting = false
let stoppedSent = false
let lastProgressAt = 0
const PROGRESS_MS = 10_000

let lastVideoTime = -1
let seekJumpReportAt = 0
const SEEK_JUMP_SEC = 1.25
const SEEK_REPORT_COOLDOWN_MS = 400

function resolveVideoEl() {
  const r = videoRef.value
  if (!r) return null
  if (r.tagName === 'VIDEO') return r
  const el = r.$el
  if (!el) return null
  if (el.tagName === 'VIDEO') return el
  return el.querySelector?.('video') || null
}

function getCurrentSeconds(e) {
  const d = e && e.detail
  if (d != null && typeof d.currentTime === 'number' && !Number.isNaN(d.currentTime)) {
    return d.currentTime
  }
  const video = resolveVideoEl()
  if (video && typeof video.currentTime === 'number' && !Number.isNaN(video.currentTime)) {
    return video.currentTime
  }
  if (lastVideoTime >= 0) return lastVideoTime
  return 0
}

function getPlaybackSeconds(e) {
  return getCurrentSeconds(e)
}

function isVideoPaused(e) {
  const d = e && e.detail
  if (d && typeof d.paused === 'boolean') return d.paused
  const video = resolveVideoEl()
  return video ? !!video.paused : false
}

function playbackCtx() {
  const s = session.value
  if (!s?.playSessionId || !s.mediaSourceId || !id.value) return null
  return {
    itemId: id.value,
    mediaSourceId: s.mediaSourceId,
    playSessionId: s.playSessionId,
  }
}

async function sendStarted(e) {
  const base = playbackCtx()
  if (!base) {
    console.warn('[Emby] 播放上报缺少上下文', { itemId: id.value, session: session.value })
    return
  }
  if (started || starting) return
  starting = true
  try {
    const sec = getPlaybackSeconds(e)
    await reportPlaybackStarted({
      ...base,
      positionTicks: secondsToTicks(sec),
      isPaused: isVideoPaused(e),
    })
    started = true
  } catch (err) {
    console.warn('Sessions/Playing', err)
  } finally {
    starting = false
  }
}

async function sendProgress(eventName, e, positionSecondsOverride) {
  const base = playbackCtx()
  if (!base || !started) return
  const sec = positionSecondsOverride != null ? positionSecondsOverride : getPlaybackSeconds(e)
  try {
    await reportPlaybackProgress(
      {
        ...base,
        positionTicks: secondsToTicks(sec),
        isPaused: isVideoPaused(e),
      },
      eventName
    )
  } catch (err) {
    console.warn('Sessions/Playing/Progress', err)
  }
}

async function sendStopped() {
  const base = playbackCtx()
  if (!base || !started || stoppedSent) return
  stoppedSent = true
  try {
    await reportPlaybackStopped({
      ...base,
      positionTicks: secondsToTicks(getPlaybackSeconds()),
      isPaused: true,
    })
  } catch (e) {
    console.warn('Sessions/Playing/Stopped', e)
  }
}

onLoad((opts) => {
  if (!user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  id.value = (opts && opts.id) || ''
  if (id.value) {
    start()
  } else {
    err.value = '缺少视频 ID'
    loading.value = false
  }
})

onUnload(() => {
  void sendStopped()
})

onBeforeUnmount(() => {
  void sendStopped()
})

function back() {
  void sendStopped()
  uni.navigateBack()
}

function onPlaying(e) {
  void sendStarted(e)
}

function onPlay(e) {
  const alreadyStarted = started
  void sendStarted(e).then(() => {
    if (alreadyStarted) void sendProgress('Unpause', e)
  })
}

function onPause(e) {
  if (started) void sendProgress('Pause', e)
}

function onTimeUpdate(e) {
  if (!started && !starting) void sendStarted(e)
  if (!started) return
  const t = getCurrentSeconds(e)
  const now = Date.now()

  if (lastVideoTime >= 0 && Math.abs(t - lastVideoTime) >= SEEK_JUMP_SEC) {
    if (now - seekJumpReportAt >= SEEK_REPORT_COOLDOWN_MS) {
      seekJumpReportAt = now
      lastProgressAt = 0
      void sendProgress('StateChange', e, t)
    }
  }
  lastVideoTime = t

  if (now - lastProgressAt < PROGRESS_MS) return
  lastProgressAt = now
  void sendProgress('TimeUpdate', e)
}

function onSeeking(e) {
  if (!started && !starting) void sendStarted(e)
  if (!started) return
  const t = getCurrentSeconds(e)
  const now = Date.now()
  if (lastVideoTime >= 0 && Math.abs(t - lastVideoTime) >= SEEK_JUMP_SEC) {
    if (now - seekJumpReportAt >= SEEK_REPORT_COOLDOWN_MS) {
      seekJumpReportAt = now
      lastProgressAt = 0
      void sendProgress('StateChange', e, t)
    }
  }
}

function onSeeked(e) {
  lastProgressAt = 0
  const t = getCurrentSeconds(e)
  lastVideoTime = t
  void sendStarted(e).then(() => {
    if (started) void sendProgress('StateChange', e, t)
  })
}

function onEnded() {
  void sendStopped()
}

function onLoaded() {
  console.log('Video loaded successfully')
}

function onVideoErr(e) {
  console.error('Video error:', e)
  currentUrlIndex++
  if (currentUrlIndex < urlList.length) {
    console.log('Trying next URL:', urlList[currentUrlIndex])
    src.value = urlList[currentUrlIndex]
  } else {
    err.value = '无法播放。浏览器可能不支持该视频格式。'
    debugInfo.value = `已尝试以下URL:\n${urlList.join('\n')}`
  }
}

async function start() {
  err.value = ''
  loading.value = true
  currentUrlIndex = 0
  urlList = []
  debugInfo.value = ''
  session.value = null
  started = false
  starting = false
  stoppedSent = false
  lastProgressAt = 0
  lastVideoTime = -1
  seekJumpReportAt = 0

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
        '[Emby] PlaybackInfo 未返回 PlaySessionId，已生成本地会话 id；取流与进度将使用该 id'
      )
      pb.PlaySessionId = playSessionId
    }
    session.value = {
      mediaSourceId: ms.Id,
      playSessionId,
    }

    urlList = [
      buildStreamUrl(id.value, pb),
      buildHlsUrl(id.value, pb),
      buildDirectUrl(id.value, ms.Id),
    ].filter(Boolean)

    if (urlList.length === 0) {
      err.value = '无法构建播放链接'
      return
    }

    src.value = urlList[0]
    debugInfo.value = `尝试播放:\n${urlList.join('\n\n')}`
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
