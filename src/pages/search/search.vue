<template>
  <app-shell active="search">
    <view class="w-full px-4 py-4">
      <view v-if="loading" class="py-12 text-center">
        <wd-loading />
      </view>
      <view v-else>
        <view v-if="hasSearched" class="mb-4">
          <text class="text-sm text-muted">搜索关键词: {{ q }}</text>
        </view>
        <view
          v-for="row in list"
          :key="row.Id"
          class="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 active:bg-white active:bg-opacity-5"
          @click="open(row)"
        >
          <image
            class="h-20 w-14 shrink-0 rounded bg-white bg-opacity-5"
            :src="posterFor(row)"
            mode="aspectFill"
          />
          <view class="min-w-0 flex-1">
            <text class="line-clamp-2 text-sm text-white text-opacity-90">{{ row.Name }}</text>
            <view class="mt-1 flex items-center gap-2">
              <text class="text-xs text-muted">{{ row.Type }}</text>
              <text v-if="row.ProductionYear" class="text-xs text-muted">·</text>
              <text v-if="row.ProductionYear" class="text-xs text-muted">{{ row.ProductionYear }}</text>
            </view>
          </view>
        </view>
        <view v-if="!list.length && hasSearched" class="py-16 text-center text-sm text-muted">无结果</view>
      </view>
    </view>
  </app-shell>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppShell from '@/components/app-shell/app-shell.vue'
import { useUserStore } from '@/stores/user'
import { useLibraryStore } from '@/stores/library'
import { fetchUserItems, buildUserItemsParams } from '@/api/emby-items'
import { useEmbyImage } from '@/composables/use-emby-image'

const user = useUserStore()
const library = useLibraryStore()
const { primaryUrl } = useEmbyImage()
const q = ref('')
const list = ref([])
const loading = ref(false)
const hasSearched = ref(false)

onLoad((opts) => {
  q.value = (opts && opts.q) || ''
  if (q.value) {
    run()
  }
})

function posterFor(row) {
  const id = row.Id
  if (!id) return ''
  return primaryUrl(id, row.ImageTags?.Primary, 200)
}

function open(row) {
  const id = row.Id
  if (id) {
    uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  }
}

async function run() {
  if (!q.value.trim()) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' })
    return
  }
  if (!user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loading.value = true
  hasSearched.value = true
  try {
    await library.loadViews()
    
    const searchTerm = q.value.trim()
    const parentId =
      library.mixedParentId ||
      library.tvParentId ||
      library.movieParentId ||
      library.fallbackParentId

    const res = await fetchUserItems(
      buildUserItemsParams(parentId, {
        IncludeItemTypes: 'Movie,Series',
        Recursive: true,
        SearchTerm: searchTerm,
        Limit: 50,
        Fields: 'PrimaryImageAspectRatio,Overview,Type,MediaType,ProductionYear',
      })
    )
    
    const items = res.data?.Items || []
    list.value = items.filter((x) => x.Id)
    
    console.log('Search results:', list.value)
  } catch (e) {
    console.error('Search error:', e)
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>
