<template>
  <app-shell :active="shellActive">
    <view v-if="!ready" class="py-8 text-center text-sm text-muted">正在加载…</view>
    <view v-else class="w-full min-w-0">
      <view v-if="breadcrumbs.length > 1" class="mb-3 flex flex-wrap items-center gap-1 text-xs text-white text-opacity-60">
        <view
          v-for="(cr, i) in breadcrumbs"
          :key="cr.id"
          class="flex items-center gap-1"
        >
          <text
            v-if="i > 0"
            class="text-white text-opacity-40"
          >
            /
          </text>
          <text
            :class="
              i === breadcrumbs.length - 1
                ? 'text-white text-opacity-90'
                : 'text-white text-opacity-70 underline'
            "
            @click.stop="onCrumbClick(i, cr)"
          >
            {{ cr.name }}
          </text>
        </view>
      </view>
      <media-row :show-title="false">
        <media-card
          v-for="item in items"
          :key="item.Id"
          :title="cardTitle(item)"
          :poster="posterFor(item)"
          @click="open(item)"
        />
      </media-row>
      <view v-if="loading" class="py-6 text-center">
        <wd-loading />
      </view>
      <view v-else-if="hasMore" class="py-4">
        <wd-button block plain type="primary" @click="loadMore">加载更多</wd-button>
      </view>
      <view v-if="!loading && !items.length" class="py-12 text-center text-sm text-muted">
        此位置暂无内容
      </view>
    </view>
  </app-shell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppShell from '@/components/app-shell/app-shell.vue'
import MediaRow from '@/components/media-row/media-row.vue'
import MediaCard from '@/components/media-card/media-card.vue'
import { useUserStore } from '@/stores/user'
import { useLibraryStore } from '@/stores/library'
import { fetchUserItems } from '@/api/emby-items'
import { useEmbyImage } from '@/composables/use-emby-image'

const user = useUserStore()
const library = useLibraryStore()
const { primaryUrl } = useEmbyImage()

const parentId = ref('')
const rootLibId = ref('')
const collectionType = ref('')
const pageTitle = ref('媒体库')
const breadcrumbs = ref([])
const items = ref([])
const start = ref(0)
const hasMore = ref(true)
const loading = ref(false)
const ready = ref(false)

const pageSize = 60
const initialSize = 48

const shellActive = computed(() =>
  rootLibId.value ? `lib-${rootLibId.value}` : 'browse'
)

const FOLDER_LIKE = new Set([
  'Folder',
  'UserView',
  'CollectionFolder',
  'Genre',
])

function cardTitle(item) {
  const t = item.Type
  if (FOLDER_LIKE.has(t)) return `📁 ${item.Name}`
  return item.Name || item.SeriesName || '未命名'
}

function posterFor(item) {
  const tag = item.ImageTags?.Primary || item.PrimaryImageTag
  if (tag) return primaryUrl(item.Id, tag, 360)
  if (FOLDER_LIKE.has(item.Type)) {
    return (
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480"><rect fill="#2a2a30" width="100%" height="100%"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#8a8a93" font-size="56">📁</text></svg>`
      )
    )
  }
  return primaryUrl(item.Id, null, 360)
}

onLoad((opts) => {
  if (!user.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  void initFromOpts(opts || {})
})

async function initFromOpts(opts) {
  ready.value = false
  items.value = []
  start.value = 0
  hasMore.value = true
  parentId.value = (opts.id || '').trim()
  rootLibId.value = ((opts.root || opts.id || '') + '').trim()
  collectionType.value = (opts.ct || '').trim()
  try {
    pageTitle.value = opts.title ? decodeURIComponent(opts.title) : '媒体库'
  } catch {
    pageTitle.value = '媒体库'
  }
  if (!parentId.value) {
    await library.loadViews()
    parentId.value = library.fallbackParentId
    rootLibId.value = parentId.value
    pageTitle.value = library.allViews[0]?.Name || '媒体库'
  }
  crumbsFromOpts(opts)
  ready.value = true
  await doLoad(initialSize)
}

function crumbsFromOpts(opts) {
  let raw = opts.crumbs || ''
  if (!raw) {
    breadcrumbs.value = [{ id: parentId.value, name: pageTitle.value }]
    return
  }
  try {
    breadcrumbs.value = JSON.parse(decodeURIComponent(raw))
  } catch {
    try {
      breadcrumbs.value = JSON.parse(raw)
    } catch {
      breadcrumbs.value = [{ id: parentId.value, name: pageTitle.value }]
    }
  }
}

async function doLoad(limit) {
  if (!parentId.value) return
  loading.value = true
  try {
    const res = await fetchUserItems({
      ParentId: parentId.value,
      Recursive: false,
      StartIndex: start.value,
      Limit: limit,
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      Fields:
        'PrimaryImageAspectRatio,Overview,Type,MediaType,SeriesName,ImageTags,PrimaryImageTag,UserData,CollectionType',
    })
    const batch = res.data?.Items || []
    items.value = items.value.concat(batch)
    start.value += batch.length
    hasMore.value = batch.length === limit
  } catch (e) {
    console.error('browse load', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loading.value || !hasMore.value) return
  await doLoad(pageSize)
}

function open(item) {
  const t = item.Type
  if (FOLDER_LIKE.has(t)) {
    const nextCrumbs = [
      ...breadcrumbs.value,
      { id: item.Id, name: item.Name || '' },
    ]
    uni.navigateTo({
      url: `/pages/browse/browse?id=${encodeURIComponent(item.Id)}&title=${encodeURIComponent(item.Name || '')}&ct=${encodeURIComponent(collectionType.value)}&root=${encodeURIComponent(rootLibId.value)}&crumbs=${encodeURIComponent(JSON.stringify(nextCrumbs))}`,
    })
    return
  }
  uni.navigateTo({ url: `/pages/detail/detail?id=${item.Id}` })
}

function onCrumbClick(index, cr) {
  if (index >= breadcrumbs.value.length - 1) return
  goCrumb(cr, index)
}

function goCrumb(cr, index) {
  if (index >= breadcrumbs.value.length - 1) return
  const slice = breadcrumbs.value.slice(0, index + 1)
  const target = slice[slice.length - 1]
  uni.redirectTo({
    url: `/pages/browse/browse?id=${encodeURIComponent(target.id)}&title=${encodeURIComponent(target.name)}&ct=${encodeURIComponent(collectionType.value)}&root=${encodeURIComponent(rootLibId.value)}&crumbs=${encodeURIComponent(JSON.stringify(slice))}`,
  })
}
</script>
