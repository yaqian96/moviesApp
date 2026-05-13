import { defineStore } from 'pinia'
import { fetchUserViews } from '@/api/emby-items'

function pickView(views, collectionType) {
  const list = views?.Items || views?.data?.Items
  if (!list?.length) return null
  return list.find((v) => v.CollectionType === collectionType) || null
}

const COLLECTION_ORDER = [
  'movies',
  'tvshows',
  'boxsets',
  'mixed',
  'music',
  'musicvideos',
  'homevideos',
  'playlists',
]

function collectionTypeRank(t) {
  const i = COLLECTION_ORDER.indexOf(t)
  return i === -1 ? 99 : i
}

export const useLibraryStore = defineStore('library', {
  state: () => ({
    movieParentId: '',
    tvParentId: '',
    mixedParentId: '',
    fallbackParentId: '',
    allViews: [],
    loaded: false,
  }),
  getters: {
    browseNavItems(state) {
      const supported = new Set(COLLECTION_ORDER)
      const list = state.allViews || []
      return list
        .filter((v) => v.CollectionType && supported.has(v.CollectionType))
        .sort(
          (a, b) =>
            collectionTypeRank(a.CollectionType) -
            collectionTypeRank(b.CollectionType)
        )
        .map((v) => ({
          label: v.Name || '媒体库',
          id: v.Id,
          collectionType: v.CollectionType,
          key: `lib-${v.Id}`,
          path: `/pages/browse/browse?id=${encodeURIComponent(v.Id)}&title=${encodeURIComponent(v.Name || '')}&ct=${encodeURIComponent(v.CollectionType || '')}`,
        }))
    },
  },
  actions: {
    async loadViews(force = false) {
      if (this.loaded && !force) return
      const { data } = await fetchUserViews()
      const list = data?.Items || []
      this.allViews = list
      this.fallbackParentId = list[0]?.Id || ''
      const movies = pickView(data, 'movies')
      const tv = pickView(data, 'tvshows')
      const mixed = pickView(data, 'mixed')
      this.movieParentId = movies?.Id || ''
      this.tvParentId = tv?.Id || ''
      this.mixedParentId = mixed?.Id || ''
      this.loaded = true
    },
    reset() {
      this.movieParentId = ''
      this.tvParentId = ''
      this.mixedParentId = ''
      this.fallbackParentId = ''
      this.allViews = []
      this.loaded = false
    },
  },
})
