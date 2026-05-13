import { defineStore } from 'pinia'
import { normalizeEmbyApiRoot } from '@/utils/emby-url'

const STORAGE_KEYS = [
  'embyBaseUrl',
  'apiKey',
  'accessToken',
  'userId',
  'userName',
  'deviceId',
]

function readStored(key) {
  try {
    const v = uni.getStorageSync(key)
    if (v === '' || v == null) return undefined
    if (typeof v === 'string' && v.startsWith('enc_')) {
      uni.removeStorageSync(key)
      return undefined
    }
    return v
  } catch {
    return undefined
  }
}

function loadFromStorage() {
  const state = {}
  STORAGE_KEYS.forEach((k) => {
    const v = readStored(k)
    if (v !== undefined) state[k] = v
  })
  if (!state.deviceId) {
    state.deviceId =
      `emby-uni-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    uni.setStorageSync('deviceId', state.deviceId)
  }
  return state
}

export const useUserStore = defineStore('user', {
  state: () => ({
    embyBaseUrl: '',
    apiKey: '',
    accessToken: '',
    userId: '',
    userName: '',
    deviceId: '',
    ...loadFromStorage(),
  }),
  getters: {
    embyApiRoot: (s) => (s.embyBaseUrl ? normalizeEmbyApiRoot(s.embyBaseUrl) : ''),
    activeToken: (s) => s.accessToken || s.apiKey,
    isLoggedIn: (s) => !!(s.embyBaseUrl && s.userId && s.accessToken),
  },
  actions: {
    setServer(url) {
      this.embyBaseUrl = (url || '').trim().replace(/\/$/, '')
      uni.setStorageSync('embyBaseUrl', this.embyBaseUrl)
    },
    setApiKey(key) {
      this.apiKey = (key || '').trim()
      uni.setStorageSync('apiKey', this.apiKey)
    },
    setSession({ accessToken, userId, userName }) {
      this.accessToken = accessToken || ''
      this.userId = userId || ''
      this.userName = userName || ''
      uni.setStorageSync('accessToken', this.accessToken)
      uni.setStorageSync('userId', this.userId)
      uni.setStorageSync('userName', this.userName)
    },
    logout() {
      this.accessToken = ''
      this.userId = ''
      this.userName = ''
      uni.removeStorageSync('accessToken')
      uni.removeStorageSync('userId')
      uni.removeStorageSync('userName')
    },
    hydrate() {
      Object.assign(this, loadFromStorage())
    },
  },
})
