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
    />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { getPlaybackInfo, buildStreamUrl, buildHlsUrl, buildDirectUrl } from '@/api/emby-playback'

const user = useUserStore()

const id = ref('')
const loading = ref(true)
const src = ref('')
const err = ref('')
const debugInfo = ref('')
let urlList = []
let currentUrlIndex = 0

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

function back() {
  uni.navigateBack()
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
  
  try {
    console.log('Getting playback info for:', id.value)
    const pb = await getPlaybackInfo(id.value)
    console.log('Playback info:', pb)
    
    if (!pb?.MediaSources?.length) {
      err.value = '无可用片源'
      debugInfo.value = JSON.stringify(pb, null, 2)
      return
    }
    
    const ms = pb.MediaSources[0]
    console.log('MediaSource:', ms)
    
    // 构建多个 URL 备用
    urlList = [
      buildStreamUrl(id.value, pb),           // MP4 直链
      buildHlsUrl(id.value, pb),              // HLS 流
      buildDirectUrl(id.value, ms.Id),        // 直接下载链接
    ].filter(Boolean)
    
    console.log('URL list:', urlList)
    
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