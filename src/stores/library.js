import { defineStore } from 'pinia'
import { fetchUserViews } from '@/api/emby-items'

function pickView(views, collectionType) {
  const list = views?.Items || views?.data?.Items
  if (!list?.length) return null
  return list.find((v) => v.CollectionType === collectionType) || null
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
