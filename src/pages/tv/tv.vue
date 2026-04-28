<template>
  <app-shell active="tv">
    <view v-if="!parentReady" class="py-8 text-center text-sm text-muted">正在解析媒体库…</view>
    <view v-else>
      <view class="mb-4 px-1">
        <text class="text-lg font-medium">电视剧</text>
      </view>
      <view class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        <media-card
          v-for="item in items"
          :key="item.Id"
          :title="item.Name"
          :poster="posterFor(item)"
          @click="open(item)"
        />
      </view>
      <view v-if="loading" class="py-6 text-center">
        <wd-loading />
      </view>
      <view v-else-if="hasMore" class="py-4">
        <wd-button block plain type="primary" @click="loadMore">加载更多</wd-button>
      </view>
      <view v-if="!loading && !items.length" class="py-12 text-center text-sm text-muted">
        暂无剧集
      </view>
    </view>
  </app-shell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppShell from '@/components/app-shell/app-shell.vue'
import MediaCard from '@/components/media-card/media-card.vue'
import { useUserStore } from '@/stores/user'
import { useLibraryStore } from '@/stores/library'
import { fetchUserItems, buildUserItemsParams } from '@/api/emby-items'
import { useEmbyImage } from '@/composables/use-emby-image'

const user = useUserStore()
const library = useLibraryStore()
const { primaryUrl } = useEmbyImage()

const pageSize = 16
const initialSize = 8
const start = ref(0)
const items = ref([])
const hasMore = ref(true)
const loading = ref(false)
const parentReady = ref(false)

let pageInflight = null
async function enterTv() {
  if (!user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  if (pageInflight) return pageInflight
  pageInflight = (async () => {
    try {
      await library.loadViews()
      parentReady.value = true
      if (!items.value.length) {
        await initLoad()
      }
    } finally {
      pageInflight = null
    }
  })()
  return pageInflight
}

onShow(() => {
  void enterTv()
})

onMounted(() => {
  void enterTv()
})

async function initLoad() {
  start.value = 0
  items.value = []
  hasMore.value = true
  await doLoad(initialSize)
}

async function loadMore() {
  if (loading.value || !hasMore.value) return
  await doLoad(pageSize)
}

async function doLoad(limit) {
  loading.value = true
  try {
    const parentId =
      library.tvParentId || library.mixedParentId || library.fallbackParentId
    const res = await fetchUserItems(
      buildUserItemsParams(parentId, {
        IncludeItemTypes: 'Series',
        Recursive: true,
        StartIndex: start.value,
        Limit: limit,
        SortBy: 'DateCreated',
        SortOrder: 'Descending',
      })
    )
    const batch = res.data?.Items || []
    items.value = items.value.concat(batch)
    start.value += batch.length
    hasMore.value = batch.length === limit
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function posterFor(item) {
  return primaryUrl(item.Id, item.ImageTags?.Primary, 360)
}

function open(item) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${item.Id}` })
}
</script>