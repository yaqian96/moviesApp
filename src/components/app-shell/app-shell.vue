<template>
  <view class="flex min-h-screen w-full bg-surface text-white">
    <view
      class="w-44 shrink-0 border-r border-solid border-white border-opacity-10"
      :class="{ '!w-0 overflow-hidden border-0': !sidebarOpen }"
    >
      <view class="flex flex-col gap-2 p-3 pt-8">
        <view
          v-for="item in nav"
          :key="item.key"
          class="flex items-center gap-2 rounded-lg px-3 py-2"
          :class="activeKey === item.key ? 'bg-white bg-opacity-10' : ''"
          @click="go(item.path, item.key)"
        >
          <text class="text-lg">{{ item.emoji }}</text>
          <text class="text-sm">{{ item.label }}</text>
        </view>
      </view>
    </view>
    <view class="flex min-h-screen min-w-0 flex-1 flex-col">
      <view
        class="flex items-center gap-2 border-b border-solid border-white border-opacity-10 p-3"
      >
        <view class="shrink-0 px-1" @click="sidebarOpen = !sidebarOpen">
          <text class="text-xl">☰</text>
        </view>
        <wd-search
          v-model="keyword"
          placeholder="搜索影视"
          hide-cancel
          custom-class="flex-1 !bg-transparent"
          @search="onSearch"
        />
      </view>
      <view class="flex-1 overflow-auto p-4">
        <slot />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const props = defineProps({
  active: {
    type: String,
    default: 'home',
  },
})

const keyword = ref('')
const sidebarOpen = ref(true)
const activeKey = ref(props.active)

const nav = [
  { label: '首页', path: '/pages/home/home', key: 'home', emoji: '⌂' },
  { label: '电影库', path: '/pages/movies/movies', key: 'movies', emoji: '▣' },
  { label: '电视剧', path: '/pages/tv/tv', key: 'tv', emoji: '▶' },
]

watch(
  () => props.active,
  (v) => {
    activeKey.value = v
  }
)

onShow(() => {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  const route = cur?.route || ''
  if (route.includes('home')) activeKey.value = 'home'
  else if (route.includes('movies')) activeKey.value = 'movies'
  else if (route.includes('tv')) activeKey.value = 'tv'
})

function go(path, key) {
  activeKey.value = key
  uni.reLaunch({ url: path })
}

function onSearch({ value }) {
  const q = (value || keyword.value || '').trim()
  if (!q) return
  uni.navigateTo({
    url: `/pages/search/search?q=${encodeURIComponent(q)}`,
  })
}
</script>
