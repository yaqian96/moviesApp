<template>
  <view class="flex min-h-screen w-full bg-surface text-white">
    <!-- 移动端遮罩 -->
    <view
      v-if="sidebarOpen && isMobile"
      class="fixed inset-0 z-30 bg-black bg-opacity-50"
      @click="sidebarOpen = false"
    />
    <!-- 侧边栏 -->
    <view
      class="shrink-0 border-r border-solid border-white border-opacity-10 transition-all duration-300"
      :class="sidebarClass"
    >
      <view class="flex flex-col gap-2 p-3 pt-8">
        <view
          v-for="item in nav"
          :key="item.key"
          class="flex items-center  rounded-lg  py-3 justify-center"
          :class="activeKey === item.key ? 'bg-white bg-opacity-10' : ''"
          @click="go(item.path, item.key)"
        >
          <text class="text-lg">{{ item.emoji }}</text>
          <text v-if="sidebarOpen" class="text-sm ml-3">{{ item.label }}</text>
        </view>
      </view>
    </view>
    <!-- 主内容 -->
    <view class="flex min-h-screen min-w-0 flex-1 flex-col">
      <!-- 顶部栏 -->
      <view
        class="flex items-center gap-2 border-b border-solid border-white border-opacity-10 p-3"
      >
        <view class="shrink-0 px-1" @click="toggleSidebar">
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const props = defineProps({
  active: {
    type: String,
    default: 'home',
  },
})

const keyword = ref('')
const sidebarOpen = ref(false)
const activeKey = ref(props.active)
const windowWidth = ref(0)

const isMobile = computed(() => (windowWidth.value || 768) < 768)

const sidebarClass = computed(() => {
  if (isMobile.value) {
    return sidebarOpen.value
      ? 'fixed left-0 top-0 z-40 h-full w-52'
      : '!w-0 overflow-hidden border-0'
  }
  return sidebarOpen.value ? 'w-44' : 'w-12'
})

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

function updateWidth() {
  try {
    const sysInfo = uni.getSystemInfoSync()
    windowWidth.value = sysInfo.windowWidth || 0
  } catch {
    /* noop */
  }
}

onMounted(() => {
  updateWidth()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateWidth)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWidth)
  }
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function go(path, key) {
  activeKey.value = key
  if (isMobile.value) {
    sidebarOpen.value = false
  }
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