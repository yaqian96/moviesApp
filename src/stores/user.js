import { defineStore } from 'pinia'
import { normalizeEmbyApiRoot } from '@/utils/emby-url'
import { setStorageSync, getStorageSync, removeStorageSync } from '@/utils/storage'
import { EMBY_CONFIG } from '@/config/emby'

const STORAGE_KEYS = [
  'embyBaseUrl',
  'accessToken',
  'userId',
  'userName',
  'deviceId',
]

function loadFromStorage() {
  const state = {}
  STORAGE_KEYS.forEach((k) => {
    try {
      const v = getStorageSync(k)
      if (v !== '' && v != null) state[k] = v
    } catch {
      /* noop */
    }
  })
  if (!state.deviceId) {
    state.deviceId =
      `emby-uni-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    setStorageSync('deviceId', state.deviceId)
  }
  return state
}

export const useUserStore = defineStore('user', {
  state: () => ({
    embyBaseUrl: '',
    apiKey: EMBY_CONFIG.apiKey,
    accessToken: '',
    userId: '',
    userName: '',
    deviceId: '',
    ...loadFromStorage(),
  }),
  getters: {
    embyApiRoot: (s) => (s.embyBaseUrl ? normalizeEmbyApiRoot(s.embyBaseUrl) : ''),
    activeToken: (s) => s.accessToken || s.apiKey,
    isLoggedIn: (s) => !!(s.embyBaseUrl && s.apiKey && s.userId && s.accessToken),
  },
  actions: {
    setServer(url) {
      this.embyBaseUrl = (url || '').trim().replace(/\/$/, '')
      setStorageSync('embyBaseUrl', this.embyBaseUrl)
    },
    setSession({ accessToken, userId, userName }) {
      this.accessToken = accessToken || ''
      this.userId = userId || ''
      this.userName = userName || ''
      setStorageSync('accessToken', this.accessToken)
      setStorageSync('userId', this.userId)
      setStorageSync('userName', this.userName)
    },
    logout() {
      this.accessToken = ''
      this.userId = ''
      this.userName = ''
      removeStorageSync('accessToken')
      removeStorageSync('userId')
      removeStorageSync('userName')
    },
    hydrate() {
      Object.assign(this, loadFromStorage())
      this.apiKey = EMBY_CONFIG.apiKey
    },
  },
})
