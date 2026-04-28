<template>
  <app-shell active="home">
    <view v-if="loading" class="py-12 text-center">
      <wd-loading />
    </view>
    <view v-else>
      <view class="mb-6 overflow-hidden rounded-xl">
        <swiper
          v-if="carouselList.length"
          class="h-48 w-full"
          circular
          autoplay
          :interval="5000"
          indicator-dots
          indicator-color="rgba(255,255,255,.35)"
          indicator-active-color="#fff"
        >
          <swiper-item v-for="item in carouselList" :key="item.Id" class="relative" @click="open(item)">
            <image
              class="h-48 w-full"
              :src="backdropFor(item)"
              mode="aspectFill"
            />
            <view class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-3">
              <text class="text-base font-medium">{{ displayName(item) }}</text>
              <text class="text-xs text-muted">{{ item.Type }}</text>
            </view>
          </swiper-item>
        </swiper>
        <view v-else class="flex h-36 items-center justify-center rounded-xl bg-card">
          <text class="text-sm text-muted">暂无内容</text>
        </view>
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

      <!-- 推荐剧集 - 显示最新集数信息 -->
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
            <!-- 电视剧名称 -->
            <text class="line-clamp-2 text-xs text-white text-opacity-90">{{ item.latestEpisode?.SeriesName || item.Name }}</text>
            <!-- 完整副标题：季名 + 集名 -->
            <view v-if="item.latestEpisode" class="mt-0.5">
              <text class="text-xs text-muted line-clamp-1">{{ formatFullTitle(item.latestEpisode) }}</text>
            </view>
          </view>
        </view>
      </media-row>

      <view class="mb-3 px-1">
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
      </view>
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

const user = useUserStore()
const library = useLibraryStore()
const { primaryUrl, backdropUrl } = useEmbyImage()

const loading = ref(true)
const resumeList = ref([])
const recoMovies = ref([])
const recoTv = ref([])
const fallbackList = ref([])

const carouselList = computed(() => {
  if (resumeList.value.length) {
    return resumeList.value
  }
  return fallbackList.value
})

let loadInflight = null
function loadOnce() {
  if (loadInflight) return loadInflight
  loadInflight = (async () => {
    try {
      await load()
    } finally {
      loadInflight = null
    }
  })()
  return loadInflight
}

async function enterHome() {
  if (!user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  await loadOnce()
}

onShow(() => {
  void enterHome()
})

onMounted(() => {
  void enterHome()
})

function displayName(item) {
  return item.Name || item.SeriesName || '未命名'
}

function formatEpisodeInfo(ep) {
  if (!ep) return ''
  const season = ep.ParentIndexNumber ? `S${ep.ParentIndexNumber}` : ''
  const episode = ep.IndexNumber ? `E${ep.IndexNumber}` : ''
  return season && episode ? `${season}${episode}` : ep.Name
}

function formatFullTitle(ep) {
  if (!ep) return ''
  const parts = []
  if (ep.SeasonName) {
    parts.push(ep.SeasonName)
  }
  if (ep.Name) {
    parts.push(ep.Name)
  }
  return parts.join(' ')
}

function posterFor(item) {
  const tag = item.ImageTags?.Primary || item.PrimaryImageTag
  return primaryUrl(item.Id, tag, 320)
}

function backdropFor(item) {
  const tag = item.BackdropImageTags?.[0]
  if (item.BackdropImageTags?.length) {
    return backdropUrl(item.Id, tag, 900, 0)
  }
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
  loading.value = true
  try {
    await library.loadViews()
    const resR = await fetchResumeItems(12)
    resumeList.value = resR.data?.Items || []
    
    const fallbackItems = []
    const hasMovieLib = library.movieParentId
    const hasTvLib = library.tvParentId
    const hasMixedLib = library.mixedParentId && !hasMovieLib && !hasTvLib
    
    if (hasMovieLib) {
      const m = await fetchUserItems(
        buildUserItemsParams(library.movieParentId, {
          IncludeItemTypes: 'Movie',
          Recursive: true,
          SortBy: 'DateCreated',
          SortOrder: 'Descending',
          Limit: 16,
        })
      )
      recoMovies.value = m.data?.Items || []
      fallbackItems.push(...(m.data?.Items || []))
    }
    if (hasTvLib) {
      const t = await fetchUserItems(
        buildUserItemsParams(library.tvParentId, {
          IncludeItemTypes: 'Series',
          Recursive: true,
          SortBy: 'DateCreated',
          SortOrder: 'Descending',
          Limit: 16,
        })
      )
      const seriesList = t.data?.Items || []
      recoTv.value = await loadLatestEpisodes(seriesList)
      fallbackItems.push(...seriesList)
    }

    if (hasMixedLib) {
      const mix = await fetchUserItems(
        buildUserItemsParams(library.mixedParentId, {
          IncludeItemTypes: 'Movie,Series',
          Recursive: true,
          SortBy: 'DateCreated',
          SortOrder: 'Descending',
          Limit: 16,
        })
      )
      const mixedItems = mix.data?.Items || []
      const movies = mixedItems.filter((i) => i.Type === 'Movie')
      const series = mixedItems.filter((i) => i.Type === 'Series')
      recoMovies.value = movies.slice(0, 16)
      recoTv.value = await loadLatestEpisodes(series.slice(0, 16))
      fallbackItems.push(...mixedItems)
    }

    if (!hasMovieLib && !hasTvLib && !hasMixedLib) {
      const p = library.fallbackParentId
      const m = await fetchUserItems(
        buildUserItemsParams(p, {
          IncludeItemTypes: 'Movie',
          Recursive: true,
          SortBy: 'DateCreated',
          SortOrder: 'Descending',
          Limit: 16,
        })
      )
      recoMovies.value = m.data?.Items || []
      fallbackItems.push(...(m.data?.Items || []))
      const t = await fetchUserItems(
        buildUserItemsParams(p, {
          IncludeItemTypes: 'Series',
          Recursive: true,
          SortBy: 'DateCreated',
          SortOrder: 'Descending',
          Limit: 16,
        })
      )
      const seriesList = t.data?.Items || []
      recoTv.value = await loadLatestEpisodes(seriesList)
      fallbackItems.push(...seriesList)
    }

    fallbackList.value = fallbackItems.slice(0, 5)
    console.log('fallbackList:', fallbackList.value)
  } catch (e) {
    console.error('load error:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadLatestEpisodes(seriesList) {
  const result = []
  for (const series of seriesList) {
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
      result.push({
        ...series,
        latestEpisode: latestEp || null,
      })
    } catch {
      result.push({
        ...series,
        latestEpisode: null,
      })
    }
  }
  return result
}
</script>

<style scoped>
.text-primary {
  color: #409eff;
}
</style>