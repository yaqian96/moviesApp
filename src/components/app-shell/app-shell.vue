<template>
  <!-- #ifdef H5 -->
  <view class="shell-h5 flex min-h-screen w-full bg-surface text-white">
    <view
      class="shell-h5-nav flex shrink-0 flex-col border-r border-solid border-white border-opacity-10 bg-shell-sidebar"
    >
      <view class="flex flex-1 flex-col gap-0.5 overflow-y-auto px-1 py-2">
        <view
          v-for="item in nav"
          :key="item.key"
          class="shell-h5-nav-item cursor-pointer rounded-lg px-2.5 py-2.5 text-sm whitespace-nowrap text-white text-opacity-90"
          :class="activeKey === item.key ? 'bg-white bg-opacity-10' : ''"
          @click="go(item.path, item.key)"
        >
          <text>{{ item.label }}</text>
        </view>
      </view>
      <view class="border-t border-solid border-white border-opacity-10 px-1 py-2">
        <view
          class="shell-h5-nav-item cursor-pointer rounded-lg px-2.5 py-2.5 text-sm whitespace-nowrap text-white text-opacity-90"
          @click="goSettings"
        >
          <text>设置</text>
        </view>
      </view>
    </view>
    <view class="flex min-h-screen min-w-0 flex-1 flex-col">
      <view
        class="flex min-h-[52px] items-center gap-3 border-b border-solid border-white border-opacity-10 px-3 py-2"
      >
        <text class="shrink-0 text-base font-medium">{{ pageTitle }}</text>
        <view class="min-w-0 flex-1">
          <wd-search
            v-model="keyword"
            placeholder="搜索影视"
            hide-cancel
            custom-class="!bg-white !bg-opacity-10"
            @search="onSearch"
          />
        </view>
      </view>
      <view class="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        <slot />
      </view>
    </view>
  </view>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <view class="flex min-h-screen w-full bg-surface text-white">
    <view
      class="sidebar-container shrink-0 border-r border-solid border-white border-opacity-10 transition-all duration-300 flex flex-col"
      :class="sidebarClass"
    >
      <view class="p-3 pb-2">
        <wd-search
          v-model="keyword"
          placeholder="搜索影视"
          hide-cancel
          custom-class="!bg-white !bg-opacity-10"
          @search="onSearch"
        />
      </view>
      <view class="flex-1 flex flex-col gap-1 p-3 pt-2 overflow-y-auto">
        <view
          v-for="item in nav"
          :key="item.key"
          class="nav-item flex items-center rounded-lg py-3 px-3 cursor-pointer"
          :class="activeKey === item.key ? 'bg-white bg-opacity-10' : ''"
          @click="go(item.path, item.key)"
        >
          <image class="nav-icon w-5 h-5" :src="item.icon" mode="aspectFit" />
          <text v-if="sidebarOpen" class="nav-label text-sm ml-3">{{ item.label }}</text>
        </view>
      </view>
      <view class="p-3 border-t border-white border-opacity-10">
        <view
          class="nav-item flex items-center rounded-lg py-3 px-3 cursor-pointer hover:bg-white hover:bg-opacity-10"
          @click="goSettings"
        >
          <image class="nav-icon w-5 h-5" src="/static/icons/settings.svg" mode="aspectFit" />
          <text v-if="sidebarOpen" class="nav-label text-sm ml-3">设置</text>
        </view>
      </view>
    </view>
    <view class="main-content flex min-h-screen min-w-0 flex-1 flex-col">
      <view
        class="flex items-center gap-2 border-b border-solid border-white border-opacity-10 p-3"
      >
        <view v-if="isMobile" class="shrink-0 px-1 cursor-pointer" @click="toggleSidebar">
          <text class="text-xl">☰</text>
        </view>
        <text class="text-base font-medium">{{ pageTitle }}</text>
      </view>
      <view class="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        <slot />
      </view>
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useLibraryStore } from '@/stores/library'

const props = defineProps({
  active: {
    type: String,
    default: 'home',
  },
})

const keyword = ref('')
const sidebarOpen = ref(true)
const activeKey = ref(props.active)
const routeTitle = ref('')
const windowWidth = ref(0)

const user = useUserStore()
const library = useLibraryStore()

function iconForCollectionType(ct) {
  const m = {
    movies: '/static/icons/movies.svg',
    tvshows: '/static/icons/tv.svg',
    boxsets: '/static/icons/movies.svg',
    mixed: '/static/icons/home.svg',
    music: '/static/icons/home.svg',
    musicvideos: '/static/icons/tv.svg',
    homevideos: '/static/icons/tv.svg',
    playlists: '/static/icons/home.svg',
  }
  return m[ct] || '/static/icons/home.svg'
}

const isMobile = computed(() => (windowWidth.value || 768) < 768)

const sidebarClass = computed(() => {
  if (isMobile.value) {
    return sidebarOpen.value
      ? 'fixed left-0 top-0 z-40 h-full w-52'
      : '!w-0 overflow-hidden border-0'
  }
  return 'fixed left-0 top-0 z-40 h-full w-52'
})

const nav = computed(() => {
  const home = {
    label: '首页',
    path: '/pages/home/home',
    key: 'home',
    icon: '/static/icons/home.svg',
  }
  if (!user.isLoggedIn) return [home]
  const rows = library.browseNavItems.map((v) => ({
    label: v.label,
    path: v.path,
    key: v.key,
    icon: iconForCollectionType(v.collectionType),
  }))
  if (rows.length) return [home, ...rows]
  return [
    home,
    {
      label: '电影库',
      path: '/pages/movies/movies',
      key: 'movies',
      icon: '/static/icons/movies.svg',
    },
    {
      label: '电视剧',
      path: '/pages/tv/tv',
      key: 'tv',
      icon: '/static/icons/tv.svg',
    },
  ]
})

const pageTitle = computed(() => {
  if (routeTitle.value) return routeTitle.value
  const map = {
    home: '首页',
    movies: '电影库',
    tv: '电视剧',
    search: '搜索结果',
    settings: '设置',
    browse: '媒体库',
  }
  return map[activeKey.value] || 'Emby 媒体库'
})

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
  const opts = cur?.options || {}
  routeTitle.value = ''
  if (route.includes('browse')) {
    try {
      routeTitle.value = opts.title ? decodeURIComponent(opts.title) : ''
    } catch {
      routeTitle.value = opts.title || ''
    }
    const root = opts.root || opts.id
    activeKey.value = root ? `lib-${root}` : 'browse'
  } else if (route.includes('home')) {
    activeKey.value = 'home'
  } else if (route.includes('movies')) {
    activeKey.value = 'movies'
  } else if (route.includes('tv')) {
    activeKey.value = 'tv'
  } else if (route.includes('search')) {
    activeKey.value = 'search'
  } else if (route.includes('settings')) {
    activeKey.value = 'settings'
  }
})

function updateWidth() {
  try {
    const sysInfo = uni.getSystemInfoSync()
    windowWidth.value = sysInfo.windowWidth || 0
    if (windowWidth.value >= 768) {
      sidebarOpen.value = true
    }
  } catch {
    /* noop */
  }
}

onMounted(() => {
  updateWidth()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateWidth)
  }
  if (user.isLoggedIn) {
    void library.loadViews().catch(() => {})
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

function goSettings() {
  activeKey.value = 'settings'
  if (isMobile.value) {
    sidebarOpen.value = false
  }
  uni.navigateTo({ url: '/pages/settings/settings' })
}

function onSearch({ value }) {
  const q = (value || keyword.value || '').trim()
  if (!q) return
  uni.navigateTo({
    url: `/pages/search/search?q=${encodeURIComponent(q)}`,
  })
}
</script>

<style scoped>
.bg-shell-sidebar {
  background-color: #1a1a1e;
}

.shell-h5-nav {
  width: max-content;
}

.shell-h5-nav-item:active {
  background-color: rgba(255, 255, 255, 0.05);
}

.sidebar-container {
  background-color: #1a1a1e;
}

.main-content {
  margin-left: 208px;
}

@media (max-width: 767px) {
  .main-content {
    margin-left: 0;
  }
}

.nav-item {
  transition: background-color 0.2s ease;
}

.nav-item:active {
  background-color: rgba(255, 255, 255, 0.05);
}

.nav-icon {
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.bg-card {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
