<template>
  <app-shell active="home">
    <view v-if="loading && !hasData" class="py-12">
      <wd-loading />
    </view>
    <view v-else>
      <!-- 继续观看 -->
      <view v-if="resumeList.length" class="mb-6">
        <view class="mb-3 flex items-center justify-between px-1">
          <text class="text-base font-medium text-white">继续观看</text>
        </view>
        <scroll-view scroll-x class="w-full whitespace-nowrap" show-scrollbar="false">
          <view class="inline-flex gap-3 pb-1">
            <view
              v-for="item in resumeList"
              :key="item.Id"
              class="w-64 shrink-0 overflow-hidden rounded-lg bg-card active:opacity-80"
              @click="open(item)"
            >
              <view class="relative">
                <image
                  class="aspect-video w-full bg-white bg-opacity-5"
                  :src="backdropFor(item)"
                  mode="aspectFill"
                />
                <!-- 播放进度条 -->
                <view class="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-40">
                  <view
                    class="h-full bg-green-500"
                    :style="{ width: (item.UserData?.PlayedPercentage || 0) + '%' }"
                  />
                </view>
                <!-- 播放按钮 -->
                <view class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <text class="text-4xl text-white text-opacity-90">▶</text>
                </view>
              </view>
              <view class="p-2">
                <text class="line-clamp-1 text-sm text-white text-opacity-90">{{ displayName(item) }}</text>
                <text v-if="item.SeriesName || item.SeasonName" class="mt-0.5 line-clamp-1 text-xs text-muted">{{ formatEpisodeInfo(item) }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <media-row v-if="recoMovies.length" title="推荐 · 电影">
        <media-card
          v-for="item in recoMovies"
          :key="item.Id"
          :title="displayName(item)"
          :poster="posterFor(item)"
          @click="open(item)"
        />
      </media-row>

      <media-row v-if="recoTv.length" title="推荐 · 剧集">
        <view
          v-for="item in recoTv"
          :key="item.Id"
          class="w-36 shrink-0 overflow-hidden rounded-lg bg-card active:opacity-80"
          @click="open(item)"
        >
          <image
            class="aspect-[2/3] w-full bg-white bg-opacity-5"
            :src="posterFor(item)"
            mode="aspectFill"
          />
          <view class="p-2">
            <text class="line-clamp-2 text-xs text-white text-opacity-90">{{ item.latestEpisode?.SeriesName || item.Name }}</text>
            <view v-if="item.latestEpisode" class="mt-0.5">
              <text class="text-xs text-muted line-clamp-1">{{ formatFullTitle(item.latestEpisode) }}</text>
            </view>
          </view>
        </view>
      </media-row>

      <!-- <view class="mb-3 px-1">
        <text class="text-base font-medium">浏览分类</text>
      </view>
      <view class="grid grid-cols-2 gap-3">
        <view
          class="flex h-24 items-center justify-center rounded-xl bg-card active:opacity-80"
          @click="goMovies"
        >
          <text class="font-medium">电影库</text>
        </view>
        <view
          class="flex h-24 items-center justify-center rounded-xl bg-card active:opacity-80"
          @click="goTv"
        >
          <text class="font-medium">电视剧</text>
        </view>
      </view> -->
    </view>
  </app-shell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppShell from '@/components/app-shell/app-shell.vue'
import MediaRow from '@/components/media-row/media-row.vue'
import MediaCard from '@/components/media-card/media-card.vue'
import { useUserStore } from '@/stores/user'
import { useLibraryStore } from '@/stores/library'
import {
  fetchResumeItems,
  fetchUserItems,
  buildUserItemsParams,
} from '@/api/emby-items'
import { useEmbyImage } from '@/composables/use-emby-image'
import { setStorageSync, getStorageSync } from '@/utils/storage'

const CACHE_KEY = 'home_cache_v2'
const CACHE_TTL = 5 * 60 * 1000

const user = useUserStore()
const library = useLibraryStore()
const { primaryUrl, backdropUrl } = useEmbyImage()

const loading = ref(false)
const resumeList = ref([])
const recoMovies = ref([])
const recoTv = ref([])

const hasData = computed(() =>
  resumeList.value.length > 0 ||
  recoMovies.value.length > 0 ||
  recoTv.value.length > 0
)

let hasLoaded = false
let loadPromise = null

onShow(() => {
  if (!hasLoaded) void enterHome()
})

onMounted(() => {
  if (!hasLoaded) void enterHome()
})

async function enterHome() {
  if (!user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  if (loadPromise) {
    await loadPromise
    return
  }
  loadPromise = load()
  try {
    await loadPromise
    hasLoaded = true
  } finally {
    loadPromise = null
  }
}

function readCache() {
  try {
    const raw = getStorageSync(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = raw
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    setStorageSync(CACHE_KEY, { ts: Date.now(), data })
  } catch {
    /* noop */
  }
}

function applyData(data) {
  resumeList.value = data.resumeList || []
  recoMovies.value = data.recoMovies || []
  recoTv.value = data.recoTv || []
}

function displayName(item) {
  return item.Name || item.SeriesName || '未命名'
}

function formatFullTitle(ep) {
  if (!ep) return ''
  const parts = []
  if (ep.SeasonName) parts.push(ep.SeasonName)
  if (ep.Name) parts.push(ep.Name)
  return parts.join(' ')
}

function formatEpisodeInfo(item) {
  const parts = []
  if (item.SeasonName) parts.push(item.SeasonName)
  if (item.IndexNumber) parts.push(`第${item.IndexNumber}集`)
  return parts.join(' · ')
}

function formatProgress(item) {
  const pct = item.UserData?.PlayedPercentage || 0
  if (pct <= 0) return '未开始'
  if (pct >= 100) return '已看完'
  return `已看 ${Math.round(pct)}%`
}

function posterFor(item) {
  const tag = item.ImageTags?.Primary || item.PrimaryImageTag
  return primaryUrl(item.Id, tag, 320)
}

function backdropFor(item) {
  const tag = item.BackdropImageTags?.[0]
  if (tag) return backdropUrl(item.Id, tag, 900, 0)
  return posterFor(item)
}

function open(item) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${item.Id}` })
}

function goMovies() {
  uni.reLaunch({ url: '/pages/movies/movies' })
}

function goTv() {
  uni.reLaunch({ url: '/pages/tv/tv' })
}

async function load() {
  const cached = readCache()
  if (cached) {
    applyData(cached)
    return
  }

  loading.value = true
  try {
    await library.loadViews()

    const resR = await fetchResumeItems(8)
    console.log('Resume items response:', resR.data)
    resumeList.value = resR.data?.Items || []
    console.log('Resume list:', resumeList.value)

    const hasMovieLib = library.movieParentId
    const hasTvLib = library.tvParentId
    const hasMixedLib = library.mixedParentId && !hasMovieLib && !hasTvLib

    const requests = []

    if (hasMovieLib) {
      requests.push(
        fetchUserItems(
          buildUserItemsParams(library.movieParentId, {
            IncludeItemTypes: 'Movie',
            Recursive: true,
            SortBy: 'DateCreated',
            SortOrder: 'Descending',
            Limit: 8,
          })
        ).then((m) => {
          recoMovies.value = m.data?.Items || []
        })
      )
    }
    if (hasTvLib) {
      requests.push(
        fetchUserItems(
          buildUserItemsParams(library.tvParentId, {
            IncludeItemTypes: 'Series',
            Recursive: true,
            SortBy: 'DateCreated',
            SortOrder: 'Descending',
            Limit: 8,
          })
        ).then(async (t) => {
          const seriesList = t.data?.Items || []
          recoTv.value = await loadLatestEpisodes(seriesList)
        })
      )
    }

    if (hasMixedLib) {
      requests.push(
        fetchUserItems(
          buildUserItemsParams(library.mixedParentId, {
            IncludeItemTypes: 'Movie,Series',
            Recursive: true,
            SortBy: 'DateCreated',
            SortOrder: 'Descending',
            Limit: 8,
          })
        ).then(async (mix) => {
          const mixedItems = mix.data?.Items || []
          const movies = mixedItems.filter((i) => i.Type === 'Movie')
          const series = mixedItems.filter((i) => i.Type === 'Series')
          recoMovies.value = movies.slice(0, 8)
          recoTv.value = await loadLatestEpisodes(series.slice(0, 8))
        })
      )
    }

    if (!hasMovieLib && !hasTvLib && !hasMixedLib) {
      const p = library.fallbackParentId
      requests.push(
        fetchUserItems(
          buildUserItemsParams(p, {
            IncludeItemTypes: 'Movie',
            Recursive: true,
            SortBy: 'DateCreated',
            SortOrder: 'Descending',
            Limit: 8,
          })
        ).then((m) => {
          recoMovies.value = m.data?.Items || []
        })
      )
      requests.push(
        fetchUserItems(
          buildUserItemsParams(p, {
            IncludeItemTypes: 'Series',
            Recursive: true,
            SortBy: 'DateCreated',
            SortOrder: 'Descending',
            Limit: 8,
          })
        ).then(async (t) => {
          const seriesList = t.data?.Items || []
          recoTv.value = await loadLatestEpisodes(seriesList)
        })
      )
    }

    await Promise.all(requests)

    writeCache({
      resumeList: resumeList.value,
      recoMovies: recoMovies.value,
      recoTv: recoTv.value,
    })
  } catch (e) {
    console.error('load error:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadLatestEpisodes(seriesList) {
  if (!seriesList.length) return []
  const episodeRequests = seriesList.map(async (series) => {
    try {
      const { data } = await fetchUserItems({
        ParentId: series.Id,
        IncludeItemTypes: 'Episode',
        Recursive: true,
        SortBy: 'DateCreated',
        SortOrder: 'Descending',
        Limit: 1,
        Fields: 'Studios,ParentIndexNumber,IndexNumber,SeasonName,SeriesName',
      })
      const latestEp = data?.Items?.[0]
      return { ...series, latestEpisode: latestEp || null }
    } catch {
      return { ...series, latestEpisode: null }
    }
  })
  return Promise.all(episodeRequests)
}
</script>

<style scoped>
.text-primary {
  color: #409eff;
}
</style>
