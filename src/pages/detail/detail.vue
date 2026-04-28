<template>
  <view class="min-h-screen bg-surface p-4">
    <view v-if="loading" class="py-16 text-center">
      <wd-loading />
    </view>
    <view v-else-if="item">
      <view class="mb-3">
        <wd-button
          type="primary"
          size="small"
          plain
          custom-class="!px-4"
          @click="back"
        >
          ← 返回
        </wd-button>
      </view>
      <image
        class="aspect-[16/9] w-full max-w-2xl rounded-lg bg-white bg-opacity-5"
        :src="hero"
        mode="aspectFill"
      />
      <view class="mt-4 text-xl font-semibold">{{ item.Name }}</view>
      <view v-if="item.ProductionYear" class="mt-1 text-sm text-muted">
        {{ item.ProductionYear }} · {{ item.Type }}
      </view>
      <view v-if="overview" class="mt-3 line-clamp-5 text-sm leading-relaxed text-white text-opacity-80">
        {{ overview }}
      </view>
      
      <!-- 剧集列表 -->
      <view v-if="isSeries && episodes.length" class="mt-6">
        <view class="mb-3 text-base font-medium">剧集列表（{{ episodes.length }}集）</view>
        <view class="flex flex-col gap-2">
          <view
            v-for="(ep, index) in episodes"
            :key="ep.Id"
            class="flex items-center gap-3 p-3 rounded-lg bg-card active:opacity-80"
            @click="playEpisode(ep)"
          >
            <image
              class="w-24 h-14 rounded bg-white bg-opacity-5 shrink-0"
              :src="episodePoster(ep)"
              mode="aspectFill"
            />
            <view class="flex-1 min-w-0">
              <view class="flex items-center gap-2">
                <text class="text-sm font-medium truncate">第{{ ep.IndexNumber }}集 {{ ep.SeriesName }}</text>
                <!-- 标签 -->
                <text v-if="index === 0" class="text-xs px-1.5 py-0.5 rounded bg-primary text-white">最新</text>
                <text v-if="ep.UserData?.Played" class="text-xs px-1.5 py-0.5 rounded bg-green-600 text-white">已看</text>
              </view>
              <view v-if="ep.Overview" class="mt-1 text-xs text-muted line-clamp-1">{{ ep.Overview }}</view>
              <view v-if="ep.RunTimeTicks" class="mt-1 text-xs text-muted">
                {{ formatDuration(ep.RunTimeTicks) }}
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view v-else class="mt-6">
        <wd-button type="primary" block :disabled="!playable" @click="goPlay">
          播放
        </wd-button>
      </view>
    </view>
    <view v-else class="py-12 text-center text-sm text-muted">未找到项目</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchItemById, fetchUserItems } from '@/api/emby-items'
import { useUserStore } from '@/stores/user'
import { useEmbyImage } from '@/composables/use-emby-image'
import { resolvePlayableId } from '@/utils/playable'

const user = useUserStore()
const { primaryUrl, backdropUrl } = useEmbyImage()

const itemId = ref('')
const item = ref(null)
const episodes = ref([])
const loading = ref(true)
const playable = ref('')

const overview = computed(() => item.value?.Overview || '')
const isSeries = computed(() => item.value?.Type === 'Series')

const hero = computed(() => {
  if (!item.value) return ''
  if (item.value.BackdropImageTags?.length) {
    return backdropUrl(
      item.value.Id,
      item.value.BackdropImageTags[0],
      1000,
      0
    )
  }
  return primaryUrl(item.value.Id, item.value.ImageTags?.Primary, 800)
})

onLoad(async (opts) => {
  if (!user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  itemId.value = (opts && opts.id) || ''
  if (!itemId.value) {
    loading.value = false
    return
  }
  await load()
})

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

function episodePoster(ep) {
  return primaryUrl(ep.Id, ep.ImageTags?.Primary, 200)
}

function formatDuration(ticks) {
  if (!ticks) return ''
  const minutes = Math.floor(ticks / 600000000)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  }
  return `${mins}分钟`
}

async function load() {
  loading.value = true
  try {
    const { data } = await fetchItemById(itemId.value)
    item.value = data
    
    // 如果是电视剧，获取所有剧集
    if (data?.Type === 'Series') {
      await loadEpisodes(data.Id)
    } else {
      playable.value = await resolvePlayableId(data)
    }
  } catch {
    item.value = null
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadEpisodes(seriesId) {
  try {
    const { data } = await fetchUserItems({
      ParentId: seriesId,
      IncludeItemTypes: 'Episode',
      Recursive: true,
      SortBy: 'ParentIndexNumber,IndexNumber',
      SortOrder: 'Ascending',
      Fields: 'PrimaryImageAspectRatio,Overview,RunTimeTicks,UserData',
    })
    // 倒序排列，最新的在前面
    episodes.value = (data?.Items || []).reverse()
    if (episodes.value.length > 0) {
      playable.value = episodes.value[0].Id
    }
  } catch {
    episodes.value = []
  }
}

function playEpisode(ep) {
  uni.navigateTo({
    url: `/pages/play/play?id=${ep.Id}`,
  })
}

function goPlay() {
  if (!playable.value) {
    uni.showToast({ title: '暂无可播资源', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/play/play?id=${playable.value}`,
  })
}
</script>

<style scoped>
.bg-card {
  background-color: rgba(255, 255, 255, 0.05);
}
.bg-primary {
  background-color: #409eff;
}
</style>